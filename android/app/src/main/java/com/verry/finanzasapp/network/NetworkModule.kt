package com.verry.finanzasapp.network

import android.content.Context
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class DynamicUrlInterceptor(private val context: Context) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        var originalRequest = chain.request()
        val configuredUrlStr = ServerConfig.getServerUrl(context)
        val baseUrl = configuredUrlStr.toHttpUrlOrNull()

        if (baseUrl != null) {
            // En OkHttp moderno, url, scheme, host y port son propiedades (sin paréntesis)
            val newUrl = originalRequest.url.newBuilder()
                .scheme(baseUrl.scheme)
                .host(baseUrl.host)
                .port(baseUrl.port)
                .build()
            originalRequest = originalRequest.newBuilder().url(newUrl).build()
        }
        return chain.proceed(originalRequest)
    }
}

object NetworkModule {
    private var retrofitInstance: Retrofit? = null

    fun provideApiService(context: Context): ApiService {
        if (retrofitInstance == null) {
            val client = OkHttpClient.Builder()
                .addInterceptor(DynamicUrlInterceptor(context))
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build()

            retrofitInstance = Retrofit.Builder()
                .baseUrl("http://localhost:3000/")
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
        }
        return retrofitInstance!!.create(ApiService::class.java)
    }
}