package com.verry.finanzasapp.network

import android.content.Context
import android.content.SharedPreferences

object ServerConfig {
    private const val PREF_NAME = "verry_finanzas_prefs"
    private const val KEY_SERVER_URL = "server_url"

    // IP por defecto actual de tu notebook
    private const val DEFAULT_URL = "http://192.168.68.51:3000"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    fun getServerUrl(context: Context): String {
        return getPrefs(context).getString(KEY_SERVER_URL, DEFAULT_URL) ?: DEFAULT_URL
    }

    fun setServerUrl(context: Context, url: String) {
        // Aseguramos limpiar espacios y barra final si la hubiera
        val cleanUrl = url.trim().removeSuffix("/")
        getPrefs(context).edit().putString(KEY_SERVER_URL, cleanUrl).apply()
    }
}