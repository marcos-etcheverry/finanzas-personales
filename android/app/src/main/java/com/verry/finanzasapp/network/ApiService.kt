package com.verry.finanzasapp.network

import com.google.gson.annotations.SerializedName
import retrofit2.Response
import retrofit2.http.*

data class TransferRequest(
    val fromAccountUid: String,
    val toAccountUid: String,
    val fromAmount: Double,
    val toAmount: Double,
    val comment: String?,
    val date: String?
)

data class CreditCardProjectionDto(
    @SerializedName("card_uid") val cardUid: String?,
    @SerializedName("card_id") val cardId: String?,
    @SerializedName("card_title") val cardTitle: String?,
    val month: String?,
    val total_expense: Double?,
    val total_income: Double?,
    val net_total: Double?
) {
    val resolvedCardId: String get() = cardUid ?: cardId ?: ""
    val resolvedTotal: Double get() = net_total ?: total_expense ?: 0.0
}

data class CreditCardDetailDto(
    val id: String,
    val installment_number: Int,
    val total_installments: Int,
    val amount: Double,
    val due_date: String,
    val status: String,
    val purchase_date: String?,
    val description: String?,
    val tag_title: String?,
    val subcategory_title: String?,
    val parent_category_title: String?,
    val item_type: String?
)

data class SettleRequest(
    val month: String,
    val card_uid: String
)

data class SettleResponse(
    val success: Boolean,
    val updatedCount: Int
)

data class AccountDto(
    val id: String?,
    val uid: String,
    val name: String?,
    val title: String?,
    val type: String?,
    val currency: String?,
    val currencyCode: String?,
    val balance: Double,
    val iconUrl: String? = null,
    val closing_day: Int? = null,
    val due_day: Int? = null,
    val color: String? = null,
    val icon: String? = null
)

data class CategoryDto(
    val uid: String,
    val title: String?,
    val parent_uid: String?,
    val type: String?,
    val iconUrl: String? = null,
    val icon: String? = null // <-- Añadido para capturar la ruta que viene del backend
)

data class TransactionRequest(
    val type: String,
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

// DTOs para Ajustes del Sistema
data class SettingRequest(
    val key: String,
    val value: String
)

data class SettingResponse(
    val success: Boolean,
    val key: String,
    val value: String
)
// Agregá este Data Class junto a los demás requests
data class CreditCardPurchaseRequest(
    @SerializedName("account_uid") val accountUid: String,
    @SerializedName("total_amount") val totalAmount: Double,
    val installments: Int,
    @SerializedName("purchase_date") val purchaseDate: String,
    val comment: String?,
    @SerializedName("category_uid") val categoryUid: String?,
    val tag: String?
)

data class CreditCardPurchaseResponse(
    val success: Boolean,
    @SerializedName("transaction_id") val transactionId: String,
    @SerializedName("installments_created") val installmentsCreated: Int,
    @SerializedName("amount_per_installment") val amountPerInstallment: Double
)

data class TransactionDto(
    val uid: String,
    val type: String, // "INCOME" o "EXPENSE"
    @SerializedName("account_uid") val accountUid: String?,
    @SerializedName("category_uid") val categoryUid: String?,
    val tag: String?,
    @SerializedName("amountInAccountCurrency") val amount: Double?,
    val date: String?, // "yyyy-MM-dd"
    val comment: String?,
    @SerializedName("account_title") val accountTitle: String?,
    @SerializedName("category_title") val categoryTitle: String?
)
interface ApiService {
    @GET("api/accounts")
    suspend fun getAccounts(): List<AccountDto>

    @GET("api/categories")
    suspend fun getCategories(): List<CategoryDto>

    @POST("api/transactions")
    suspend fun createTransaction(@Body request: TransactionRequest): TransactionResponse

    @GET("api/credit-cards/projections")
    suspend fun getCreditCardProjections(): List<CreditCardProjectionDto>

    @GET("api/credit-cards/details")
    suspend fun getCreditCardDetails(
        @Query("card_uid") cardUid: String,
        @Query("month") month: String,
        @Query("status") status: String = "pending"
    ): List<CreditCardDetailDto>

    @POST("api/credit-cards/settle")
    suspend fun settleCreditCardPeriod(@Body request: SettleRequest): SettleResponse

    @POST("api/transfers")
    suspend fun createTransfer(@Body request: TransferRequest): Response<Any>

    // --- ENDPOINTS DE CONFIGURACIÓN Y AJUSTES ---
    @GET("api/settings")
    suspend fun getSettings(): Map<String, String>

    @POST("api/settings")
    suspend fun updateSetting(@Body request: SettingRequest): SettingResponse

    @POST("api/credit-cards/purchase")
    suspend fun createCreditCardPurchase(@Body request: CreditCardPurchaseRequest): CreditCardPurchaseResponse

    @GET("api/transactions")
    suspend fun getTransactions(): List<TransactionDto>
}