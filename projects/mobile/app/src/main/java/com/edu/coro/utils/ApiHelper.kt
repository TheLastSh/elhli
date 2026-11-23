package com.edu.coro.utils

import com.edu.coro.api.ApiResponse
import com.google.gson.Gson
import java.io.IOException

data class ApiResult<T>(val ok: Boolean, val message: String? = null, val data: T? = null, val errorCode: String? = null)

class ApiHelper(private val client: okhttp3.OkHttpClient = HttpClient.client) {
    private val gson = Gson()

    fun <T> call(url: String, body: Map<String, Any>? = null): ApiResult<T> {
        val bodyBuilder = okhttp3.RequestBody.create(
            okhttp3.MediaType.parse("application/json"),
            if (body != null) gson.toJson(body) else "{}"
        )
        val request = okhttp3.Request.Builder()
            .url(HttpClient.API_BASE + url)
            .header("Content-Type", "application/json")
            .post(bodyBuilder)
            .build()
        val response = client.newCall(request).execute()
        val payload = response.body()?.string()
        val parsed = payload?.let { gson.fromJson(it, ApiResponse::class.java) }
        return if (response.isSuccessful && parsed != null) {
            ApiResult(parsed.ok, parsed.message, parsed.data, null)
        } else {
            val bodyData = parsed?.data
            ApiResult(false, parsed?.message, bodyData, (parsed?.message ?: "Error HTTP ${response.code()}"))
        }
    }

    fun login(email: String, password: String): ApiResult<Map<String, Any>> {
        val res = call<Map<String, Any>>("/api/users/login", mapOf("email" to email, "password" to password))
        if (res.ok) {
            val data = res.data as? Map<*, *>
            val tokens = (data?.get("tokens") as? Map<*, *>)
            val user = (data?.get("user") as? Map<*, *>)
            TokenStore.save(tokens?.get("access")?.toString(), tokens?.get("refresh")?.toString())
        }
        return res
    }
}
