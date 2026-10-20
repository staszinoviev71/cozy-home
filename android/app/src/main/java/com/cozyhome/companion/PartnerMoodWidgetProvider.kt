package com.cozyhome.companion

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class PartnerMoodWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        private const val PREFS_NAME = "cozy_widget_prefs"

        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val partnerLabel = prefs.getString("partner_label", "НАСТРОЕНИЕ: ЛЮБИМАЯ") ?: "НАСТРОЕНИЕ: ЛЮБИМАЯ"
            val moodTitle = prefs.getString("mood_title", "На волне радости!") ?: "На волне радости!"
            val moodEmoji = prefs.getString("mood_emoji", "🐕") ?: "🐕"
            val statusTime = prefs.getString("status_time", "только что • связь отличная") ?: "только что • связь отличная"

            val views = RemoteViews(context.packageName, R.layout.widget_partner_mood)
            views.setTextViewText(R.id.widget_partner_label, partnerLabel)
            views.setTextViewText(R.id.widget_mood_title, moodTitle)
            views.setTextViewText(R.id.widget_avatar_emoji, moodEmoji)
            views.setTextViewText(R.id.widget_status_time, statusTime)

            // Открытие приложения при клике на виджет или его кнопки
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
            views.setOnClickPendingIntent(R.id.btn_widget_hug, pendingIntent)
            views.setOnClickPendingIntent(R.id.btn_widget_on_way, pendingIntent)
            views.setOnClickPendingIntent(R.id.btn_widget_shopping, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        fun saveWidgetData(context: Context, partnerLabel: String, moodTitle: String, moodEmoji: String, statusTime: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putString("partner_label", partnerLabel)
                .putString("mood_title", moodTitle)
                .putString("mood_emoji", moodEmoji)
                .putString("status_time", statusTime)
                .apply()

            updateAllWidgets(context)
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, PartnerMoodWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }
}
