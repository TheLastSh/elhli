package com.edu.coro.utils

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

object TokenStore {
    private const val KEY_ACCESS = "edu_access_token"
    private const val KEY_REFRESH = "edu_refresh_token"
    private val prefs by lazy { HttpClient.appContext?.getSharedPreferences("edu_auth", 0) }

    fun save(access: String?, refresh: String?) {
        prefs?.edit()?.apply {
            access?.let { putString(KEY_ACCESS, it) }
            refresh?.let { putString(KEY_REFRESH, it) }
        }?.apply()
    }
    fun access(): String? = prefs?.getString(KEY_ACCESS, null)
    fun refresh(): String? = prefs?.getString(KEY_REFRESH, null)
    fun clear() = prefs?.edit()?.clear()?.apply()
}

object HttpClient {
    var appContext: android.content.Context? = null
    private const val API = "http://10.0.2.2:3500" // adb reverse o IP de la LAN

    val authInterceptor = Interceptor { chain ->
        val token = TokenStore.access()
        val req = if (token != null) {
            chain.request().newBuilder().header("Authorization", "Bearer $token").build()
        } else chain.request()
        chain.proceed(req)
    }

    val client = OkHttpClient.Builder()
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(authInterceptor)
        .build()

    const val API_BASE = API
}
