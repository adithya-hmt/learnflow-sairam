package edu.sairam.learnflow;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class AttendanceWebViewActivity extends Activity {
  private static final String DEPLOYMENT_ID = "AKfycby2RWaYHWIIVGeN07CczwRnoP7Tjoe5_1ETRhdQKXtCiPXpNCYRPzSVSUSxn0XozerMBw";
  private static final Pattern SAFE_VALUE = Pattern.compile("[A-Za-z0-9_-]{2,40}");
  private static final Set<String> ALLOWED_ORIGINS = new HashSet<>(Arrays.asList(
    "https://script.google.com",
    "https://script.googleusercontent.com",
    "https://*.googleusercontent.com"
  ));

  private final Handler handler = new Handler(Looper.getMainLooper());
  private WebView webView;
  private TextView statusView;
  private Button actionButton;
  private JavaScriptReplyProxy formProxy;
  private String classCode;
  private String token;
  private String studentId;
  private String terminalStatus;

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    String url = getIntent().getStringExtra("url");
    studentId = getIntent().getStringExtra("studentId");
    classCode = getIntent().getStringExtra("classCode");
    Uri uri = url == null ? null : Uri.parse(url);
    token = uri == null ? null : uri.getQueryParameter("t");

    buildScreen();
    if (!isValidRequest(uri)) {
      finishWith("rejected", "This is not the approved live college attendance QR.", false);
      return;
    }
    configureWebView();
    if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)
      || !WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
      finishWith("unverified", "Update Android System WebView before using automatic attendance.", false);
      return;
    }

    WebViewCompat.addWebMessageListener(webView, "LearnFlowAttendance", ALLOWED_ORIGINS, this::onWebMessage);
    WebViewCompat.addDocumentStartJavaScript(webView, bridgeScript(), ALLOWED_ORIGINS);
    statusView.setText("Opening the verified college attendance page…");
    webView.loadUrl(uri.toString());
    handler.postDelayed(() -> {
      if (formProxy == null && terminalStatus == null) finishWith("unverified", "The attendance form did not appear. Scan the latest classroom QR and try again.", false);
    }, 30_000);
  }

  private void buildScreen() {
    int padding = dp(16);
    LinearLayout root = new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setPadding(padding, padding, padding, padding);
    root.setBackgroundColor(Color.rgb(245, 247, 250));

    Button back = new Button(this);
    back.setText("Back");
    back.setAllCaps(false);
    back.setOnClickListener(view -> finishCancelled());
    root.addView(back, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT));

    TextView title = new TextView(this);
    title.setText("Class " + (classCode == null ? "attendance" : classCode));
    title.setTextColor(Color.rgb(15, 36, 48));
    title.setTextSize(24);
    title.setTypeface(null, android.graphics.Typeface.BOLD);
    title.setPadding(0, dp(10), 0, dp(4));
    root.addView(title);

    TextView subtitle = new TextView(this);
    subtitle.setText("SCC ID " + (studentId == null ? "" : studentId));
    subtitle.setTextColor(Color.rgb(83, 102, 113));
    subtitle.setTextSize(14);
    subtitle.setPadding(0, 0, 0, dp(12));
    root.addView(subtitle);

    statusView = new TextView(this);
    statusView.setText("Checking QR…");
    statusView.setTextColor(Color.rgb(15, 36, 48));
    statusView.setTextSize(15);
    statusView.setPadding(dp(14), dp(14), dp(14), dp(14));
    statusView.setBackgroundColor(Color.rgb(221, 246, 239));
    root.addView(statusView, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

    actionButton = new Button(this);
    actionButton.setText("Confirm attendance");
    actionButton.setAllCaps(false);
    actionButton.setVisibility(View.GONE);
    actionButton.setOnClickListener(view -> submitOrClose());
    LinearLayout.LayoutParams actionParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    actionParams.setMargins(0, dp(10), 0, dp(10));
    root.addView(actionButton, actionParams);

    webView = new WebView(this);
    LinearLayout.LayoutParams webParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f);
    webParams.setMargins(0, dp(12), 0, 0);
    root.addView(webView, webParams);
    setContentView(root);
  }

  private void configureWebView() {
    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    if (android.os.Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
    CookieManager.getInstance().setAcceptCookie(true);
    CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
    webView.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        return !isAllowedNavigation(request.getUrl());
      }

      @Override
      public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        handler.cancel();
        finishWith("rejected", "The college page failed its security check.", false);
      }

      @Override
      public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        if (request.isForMainFrame()) finishWith("unverified", "The attendance page could not be loaded.", false);
      }
    });
  }

  private boolean isValidRequest(Uri uri) {
    return uri != null
      && "https".equalsIgnoreCase(uri.getScheme())
      && "script.google.com".equalsIgnoreCase(uri.getHost())
      && ("/macros/s/" + DEPLOYMENT_ID + "/exec").equals(uri.getPath())
      && classCode != null && classCode.equals(uri.getQueryParameter("v"))
      && token != null && SAFE_VALUE.matcher(token).matches()
      && studentId != null && SAFE_VALUE.matcher(studentId).matches();
  }

  private boolean isAllowedNavigation(Uri uri) {
    if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) return false;
    String host = uri.getHost().toLowerCase(Locale.ROOT);
    return host.equals("script.google.com") || host.equals("script.googleusercontent.com") || host.endsWith(".googleusercontent.com");
  }

  private void onWebMessage(WebView view, WebMessageCompat message, Uri sourceOrigin, boolean isMainFrame, JavaScriptReplyProxy replyProxy) {
    if (!isAllowedNavigation(sourceOrigin) || message.getType() != WebMessageCompat.TYPE_STRING) return;
    try {
      JSONObject payload = new JSONObject(message.getData());
      String event = payload.optString("event");
      if (!classCode.equals(payload.optString("classCode")) || !token.equals(payload.optString("token"))) return;
      if ("FORM_READY".equals(event)) {
        formProxy = replyProxy;
        statusView.setText("Verified form found. Filling " + studentId + "…");
        replyProxy.postMessage(new JSONObject().put("action", "FILL").put("studentId", studentId).toString());
      } else if ("FILLED".equals(event) && formProxy != null) {
        statusView.setText("SCC ID filled. Confirm submission for class " + classCode + ".");
        actionButton.setVisibility(View.VISIBLE);
      } else if ("SUBMITTING".equals(event) && formProxy != null) {
        statusView.setText("Waiting for the college attendance server…");
      } else if ("RESULT".equals(event) && formProxy != null) {
        handleCollegeResult(payload.optString("message"));
      }
    } catch (JSONException ignored) {
      // Messages from web content are untrusted and ignored unless valid JSON.
    }
  }

  private void submitOrClose() {
    if (terminalStatus != null) {
      finish();
      return;
    }
    if (formProxy == null) return;
    actionButton.setEnabled(false);
    actionButton.setVisibility(View.GONE);
    formProxy.postMessage("{\"action\":\"SUBMIT\"}");
  }

  private void handleCollegeResult(String message) {
    String clean = message == null ? "" : message.trim();
    if (clean.isEmpty()) return;
    String lower = clean.toLowerCase(Locale.ROOT);
    boolean rejected = lower.contains("invalid") || lower.contains("expired") || lower.contains("failed") || lower.contains("error") || lower.contains("not allowed") || lower.contains("already");
    boolean confirmed = !rejected && (lower.contains("success") || lower.contains("marked") || lower.contains("recorded") || lower.contains("present"));
    finishWith(confirmed ? "confirmed" : rejected ? "rejected" : "unverified", clean, confirmed);
  }

  private void finishWith(String status, String message, boolean autoClose) {
    if (terminalStatus != null) return;
    terminalStatus = status;
    statusView.setText(message);
    statusView.setBackgroundColor("confirmed".equals(status) ? Color.rgb(221, 246, 239) : "rejected".equals(status) ? Color.rgb(248, 227, 223) : Color.rgb(238, 240, 243));
    actionButton.setEnabled(true);
    actionButton.setText(autoClose ? "Done" : "Close");
    actionButton.setVisibility(View.VISIBLE);
    Intent result = new Intent().putExtra("status", status).putExtra("message", message);
    setResult(RESULT_OK, result);
    if (autoClose) handler.postDelayed(this::finish, 1600);
  }

  private void finishCancelled() {
    if (terminalStatus == null) setResult(RESULT_CANCELED, new Intent().putExtra("status", "cancelled").putExtra("message", "Attendance was not submitted."));
    finish();
  }

  private String bridgeScript() {
    return "(() => {"
      + "if (window.__learnFlowAttendance) return; window.__learnFlowAttendance = true;"
      + "const expectedClass=" + JSONObject.quote(classCode) + ", expectedToken=" + JSONObject.quote(token) + ";"
      + "let input,button,last='',ready=false;"
      + "const post=o=>{try{o.classCode=expectedClass;o.token=expectedToken;LearnFlowAttendance.postMessage(JSON.stringify(o));}catch(e){}};"
      + "const report=()=>{const m=document.getElementById('msg');if(!m)return;const t=(m.innerText||m.textContent||'').trim();if(t&&t!==last){last=t;post({event:'RESULT',message:t});}};"
      + "const find=()=>{if(ready)return;input=document.getElementById('studentid');button=document.querySelector('button[onclick*=\"submitAttendance\"]');if(!input||!button)return;const scripts=[...document.scripts].map(s=>s.textContent||'').join('\\n');if(!scripts.includes(expectedClass)||!scripts.includes(expectedToken))return;ready=true;const m=document.getElementById('msg');if(m)new MutationObserver(report).observe(m,{childList:true,subtree:true,characterData:true});post({event:'FORM_READY',classCode:expectedClass,token:expectedToken});};"
      + "LearnFlowAttendance.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.action==='FILL'&&ready){input.value=m.studentId;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));post({event:'FILLED'});}else if(m.action==='SUBMIT'&&ready){button.click();post({event:'SUBMITTING'});}}catch(x){}};"
      + "new MutationObserver(()=>{find();report();}).observe(document,{childList:true,subtree:true});"
      + "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',find,{once:true});else find();"
      + "})();";
  }

  private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }

  @Override
  protected void onDestroy() {
    handler.removeCallbacksAndMessages(null);
    if (webView != null) {
      webView.stopLoading();
      webView.destroy();
    }
    super.onDestroy();
  }
}
