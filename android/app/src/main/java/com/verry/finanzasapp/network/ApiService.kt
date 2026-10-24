package com.verry.finanzasapp.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import com.google.gson.annotations.SerializedName

data class AccountDto(
    @SerializedName("id") val id: String?,
    @SerializedName("uid") val uid: String,
    @SerializedName("name") val name: String?,
    @SerializedName("title") val title: String,
    @SerializedName("type") val type: String?, // <-- Propiedad obligatoria
    @SerializedName("currency") val currency: String?,
    @SerializedName("currencyCode") val currencyCode: String?,
    @SerializedName("balance") val balance: Double
)

data class CategoryDto(
    val uid: String,
    val title: String,
    val parent_uid: String?,
    val type: String? // <-- Agregamos el tipo ('expense' o 'income')
)

data class TransactionRequest(
    val type: String, // "EXPENSE" o "INCOME"
    val account_uid: String,
    val category_uid: String?,
    val tag: String?,
    val amount: Double,
    val comment: String?,
    val date: String?
)

data class TransactionResponse(
    val uid: String,
    val type: String,
    val account_uid: String,
    val amount: Double,
    val date: String
)

interface ApiService {
    @GET("api/accounts")
    suspend fun getAccounts(): List<AccountDto>

    @GET("api/categories")
    suspend fun getCategories(): List<CategoryDto>

    @POST("api/transactions")
    suspend fun createTransaction(@Body request: TransactionRequest): TransactionResponse
}

object NetworkModule {
    private const val BASE_URL = "http://192.168.68.51:3000/"

    val apiService: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}