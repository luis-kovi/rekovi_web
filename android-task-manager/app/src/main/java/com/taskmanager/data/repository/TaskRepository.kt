package com.taskmanager.data.repository

import com.taskmanager.domain.model.Card
import com.taskmanager.domain.model.PermissionType
import com.taskmanager.network.SupabaseApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TaskRepository @Inject constructor(
    private val apiService: SupabaseApiService,
    private val authRepository: AuthRepository
) {
    
    private val _cards = MutableStateFlow<List<Card>>(emptyList())
    val cards: Flow<List<Card>> = _cards.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: Flow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: Flow<String?> = _error.asStateFlow()
    
    suspend fun loadCards(forceRefresh: Boolean = false): Result<List<Card>> {
        if (_isLoading.value && !forceRefresh) {
            return Result.success(_cards.value)
        }
        
        _isLoading.value = true
        _error.value = null
        
        return try {
            val token = authRepository.getAccessToken()
            val permissionType = authRepository.getPermissionType()
            val currentUser = authRepository.currentUser
            
            if (token == null) {
                return Result.failure(Exception("Token não encontrado"))
            }
            
            val filters = buildCardFilters(permissionType, currentUser.toString())
            val response = apiService.getCardsWithFilters(
                token = "Bearer $token",
                apiKey = SupabaseApiService.ANON_KEY,
                filters = filters
            )
            
            if (response.isSuccessful) {
                val cards = response.body() ?: emptyList()
                val filteredCards = cards.filter { card ->
                    card.id.isNotBlank() && 
                    card.placa.isNotBlank() && 
                    Card.validPhases.contains(card.faseAtual)
                }
                
                _cards.value = filteredCards
                Result.success(filteredCards)
            } else {
                val errorMsg = "Erro ao carregar cards: ${response.message()}"
                _error.value = errorMsg
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            _error.value = e.message
            Result.failure(e)
        } finally {
            _isLoading.value = false
        }
    }
    
    private fun buildCardFilters(permissionType: String?, userEmail: String?): Map<String, String> {
        val filters = mutableMapOf<String, String>()
        
        // Filtrar por fases válidas
        filters["phase_name"] = "in.(${Card.validPhases.joinToString(",") { "\"$it\"" }})"
        filters["order"] = "card_id.asc"
        filters["limit"] = "100000"
        
        // Adicionar seleção de campos
        filters["select"] = """
            card_id, placa_veiculo, nome_driver, nome_chofer_recolha,
            phase_name, created_at, email_chofer, empresa_recolha,
            modelo_veiculo, telefone_contato, telefone_opcional, email_cliente,
            endereco_cadastro, endereco_recolha, link_mapa, origem_locacao,
            valor_recolha, custo_km_adicional, public_url
        """.trimIndent().replace("\n", "")
        
        // Aplicar filtros baseados no tipo de permissão
        when (PermissionType.fromString(permissionType)) {
            PermissionType.ATIVA, PermissionType.ONSYSTEM -> {
                filters["empresa_recolha"] = "ilike.*$permissionType*"
            }
            PermissionType.CHOFER -> {
                if (userEmail != null) {
                    filters["email_chofer"] = "eq.$userEmail"
                }
            }
            PermissionType.ADMIN, PermissionType.KOVI -> {
                // Admin e Kovi podem ver todos os cards
            }
            PermissionType.DEFAULT -> {
                // Usuário sem permissão não vê nenhum card
                filters["card_id"] = "eq.impossivel"
            }
        }
        
        return filters
    }
    
    fun searchCards(query: String): List<Card> {
        if (query.isBlank()) return _cards.value
        
        val searchQuery = query.lowercase()
        return _cards.value.filter { card ->
            card.placa.lowercase().contains(searchQuery) ||
            card.nomeDriver.lowercase().contains(searchQuery) ||
            card.chofer.lowercase().contains(searchQuery) ||
            card.faseAtual.lowercase().contains(searchQuery) ||
            card.empresaResponsavel?.lowercase()?.contains(searchQuery) == true
        }
    }
    
    fun filterCardsByPhase(phase: String): List<Card> {
        if (phase == "all") return _cards.value
        return _cards.value.filter { it.faseAtual == phase }
    }
    
    fun getCardById(cardId: String): Card? {
        return _cards.value.find { it.id == cardId }
    }
    
    fun clearError() {
        _error.value = null
    }
    
    fun getPhaseColor(phase: String): String {
        return when (phase) {
            "Fila de Recolha" -> "#FFA500"
            "Aprovar Custo de Recolha" -> "#FF6B6B"
            "Tentativa 1 de Recolha" -> "#4ECDC4"
            "Tentativa 2 de Recolha" -> "#45B7D1"
            "Tentativa 3 de Recolha" -> "#96CEB4"
            "Desbloquear Veículo" -> "#FFEAA7"
            "Solicitar Guincho" -> "#DDA0DD"
            "Nova tentativa de recolha" -> "#98D8C8"
            "Confirmação de Entrega no Pátio" -> "#A8E6CF"
            else -> "#BDC3C7"
        }
    }
    
    fun getAdaptedPhaseName(phase: String): String {
        return when (phase) {
            "Fila de Recolha" -> "Aguardando"
            "Aprovar Custo de Recolha" -> "Aprovação"
            "Tentativa 1 de Recolha" -> "Tentativa 1"
            "Tentativa 2 de Recolha" -> "Tentativa 2"
            "Tentativa 3 de Recolha" -> "Tentativa 3"
            "Desbloquear Veículo" -> "Desbloqueio"
            "Solicitar Guincho" -> "Guincho"
            "Nova tentativa de recolha" -> "Nova Tentativa"
            "Confirmação de Entrega no Pátio" -> "Entregue"
            else -> phase
        }
    }
}