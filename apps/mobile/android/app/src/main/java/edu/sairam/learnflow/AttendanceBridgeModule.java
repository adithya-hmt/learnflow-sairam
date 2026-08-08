package edu.sairam.learnflow;

import android.app.Activity;
import android.content.Intent;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

public final class AttendanceBridgeModule extends ReactContextBaseJavaModule {
  private static final int REQUEST_ATTENDANCE = 4104;
  private Promise pendingPromise;

  private final ActivityEventListener activityListener = new BaseActivityEventListener() {
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, @Nullable Intent data) {
      if (requestCode != REQUEST_ATTENDANCE || pendingPromise == null) return;
      WritableMap result = new WritableNativeMap();
      result.putString("status", data == null ? "cancelled" : data.getStringExtra("status"));
      result.putString("message", data == null ? "Attendance screen closed." : data.getStringExtra("message"));
      pendingPromise.resolve(result);
      pendingPromise = null;
    }
  };

  AttendanceBridgeModule(ReactApplicationContext context) {
    super(context);
    context.addActivityEventListener(activityListener);
  }

  @NonNull
  @Override
  public String getName() { return "AttendanceBridge"; }

  @ReactMethod
  public void open(String url, String studentId, String classCode, Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "LearnFlow is not currently visible.");
      return;
    }
    if (pendingPromise != null) {
      promise.reject("ALREADY_OPEN", "The attendance screen is already open.");
      return;
    }
    pendingPromise = promise;
    Intent intent = new Intent(activity, AttendanceWebViewActivity.class);
    intent.putExtra("url", url);
    intent.putExtra("studentId", studentId);
    intent.putExtra("classCode", classCode);
    activity.startActivityForResult(intent, REQUEST_ATTENDANCE);
  }
}
