package edu.sairam.learnflow.phoneactivity

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class ExpoPhoneActivityModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoPhoneActivity")

    AsyncFunction("hasUsageAccessAsync") {
      hasUsageAccess()
    }

    AsyncFunction("openUsageAccessSettingsAsync") {
      val context = appContext.reactContext ?: error("Android context is unavailable")
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      if (intent.resolveActivity(context.packageManager) == null) error("Usage Access settings are unavailable on this device")
      context.startActivity(intent)
    }

    AsyncFunction("getUsageAsync") { requestedDays: Int ->
      val context = appContext.reactContext ?: error("Android context is unavailable")
      val days = requestedDays.coerceIn(1, 7)
      val now = System.currentTimeMillis()
      val start = Calendar.getInstance().apply {
        add(Calendar.DAY_OF_YEAR, -(days - 1))
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }.timeInMillis

      if (!hasUsageAccess()) return@AsyncFunction mapOf(
        "permissionGranted" to false,
        "totalMinutes" to 0,
        "apps" to emptyList<Map<String, Any>>()
      )

      val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val allApps = manager.queryAndAggregateUsageStats(start, now).mapNotNull { (packageName, stats) ->
        val minutes = stats.totalTimeInForeground / 60_000
        if (minutes <= 0 || packageName == context.packageName) null else mapOf(
          "packageName" to packageName,
          "name" to appName(context.packageManager, packageName),
          "minutes" to minutes,
          "lastUsedAt" to stats.lastTimeUsed
        )
      }.sortedByDescending { it["minutes"] as Long }
      val apps = allApps.take(12)

      mapOf(
        "permissionGranted" to true,
        "totalMinutes" to allApps.sumOf { it["minutes"] as Long },
        "apps" to apps,
        "generatedAt" to now
      )
    }
  }

  private fun hasUsageAccess(): Boolean {
    val context = appContext.reactContext ?: return false
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    return appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName) == AppOpsManager.MODE_ALLOWED
  }

  private fun appName(packageManager: PackageManager, packageName: String): String = try {
    packageManager.getApplicationLabel(packageManager.getApplicationInfo(packageName, 0)).toString()
  } catch (_: PackageManager.NameNotFoundException) {
    packageName.substringAfterLast('.').replaceFirstChar { it.uppercase() }
  }
}
