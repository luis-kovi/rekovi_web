package com.taskmanager.network

import com.taskmanager.domain.model.ApiResponse
import com.taskmanager.domain.model.AuthRequest
import com.taskmanager.domain.model.AuthResponse
import com.taskmanager.domain.model.Card
import com.taskmanager.domain.model.User
import retrofit2.Response
import retrofit2.http.*

interface SupabaseApiService {
    
    // Autenticação
    @POST("auth/v1/token?grant_type=password")
    suspend fun login(@Body request: AuthRequest): Response<AuthResponse>
    
    @POST("auth/v1/logout")
    suspend fun logout(@Header("Authorization") token: String): Response<Unit>
    
    @GET("auth/v1/user")
    suspend fun getCurrentUser(@Header("Authorization") token: String): Response<User>
    
    // Cards/Tarefas
    @GET("rest/v1/v_pipefy_cards_detalhada")
    suspend fun getCards(
        @Header("Authorization") token: String,
        @Header("apikey") apiKey: String,
        @Query("select") select: String = """
            card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
            phase_name, created_at, email_chofer, empresa_recolha,
            modelo_veiculo, telefone_contato, telefone_opcional, email_cliente,
            endereco_cadastro, endereco_recolha, link_mapa, origem_locacao,
            valor_recolha, custo_km_adicional, public_url
        """.trimIndent().replace("\n", ""),
        @Query("order") order: String = "card_id.asc",
        @Query("limit") limit: Int = 100000,
        @Query("phase_name") phaseNames: String? = null,
        @Query("empresa_recolha") empresaRecolha: String? = null,
        @Query("email_chofer") emailChofer: String? = null
    ): Response<List<Card>>
    
    @GET("rest/v1/v_pipefy_cards_detalhada")
    suspend fun getCardsWithFilters(
        @Header("Authorization") token: String,
        @Header("apikey") apiKey: String,
        @QueryMap filters: Map<String, String>
    ): Response<List<Card>>
    
    companion object {
        const val BASE_URL = "https://your-supabase-url.supabase.co/"
        const val ANON_KEY = "your-anon-key-here"
    }
}