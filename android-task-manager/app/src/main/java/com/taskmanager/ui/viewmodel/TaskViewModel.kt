package com.taskmanager.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.taskmanager.data.repository.TaskRepository
import com.taskmanager.domain.model.Card
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TaskViewModel @Inject constructor(
    private val taskRepository: TaskRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(TaskUiState())
    val uiState: StateFlow<TaskUiState> = _uiState.asStateFlow()
    
    private val _searchQuery = MutableStateFlow("")
    private val _selectedPhase = MutableStateFlow("all")
    
    val isLoading = taskRepository.isLoading
    val error = taskRepository.error
    
    // Combinar cards com filtros de busca e fase
    val filteredCards = combine(
        taskRepository.cards,
        _searchQuery,
        _selectedPhase
    ) { cards, query, phase ->
        var filtered = cards
        
        // Aplicar filtro de fase
        if (phase != "all") {
            filtered = filtered.filter { it.faseAtual == phase }
        }
        
        // Aplicar busca
        if (query.isNotBlank()) {
            val searchQuery = query.lowercase()
            filtered = filtered.filter { card ->
                card.placa.lowercase().contains(searchQuery) ||
                card.nomeDriver.lowercase().contains(searchQuery) ||
                card.chofer.lowercase().contains(searchQuery) ||
                card.faseAtual.lowercase().contains(searchQuery) ||
                card.empresaResponsavel?.lowercase()?.contains(searchQuery) == true
            }
        }
        
        filtered
    }
    
    init {
        loadTasks()
    }
    
    fun loadTasks(forceRefresh: Boolean = false) {
        viewModelScope.launch {
            taskRepository.loadCards(forceRefresh)
        }
    }
    
    fun refreshTasks() {
        loadTasks(forceRefresh = true)
    }
    
    fun searchTasks(query: String) {
        _searchQuery.value = query
    }
    
    fun filterByPhase(phase: String) {
        _selectedPhase.value = phase
    }
    
    fun getCardById(cardId: String): Card? {
        return taskRepository.getCardById(cardId)
    }
    
    fun getPhaseColor(phase: String): String {
        return taskRepository.getPhaseColor(phase)
    }
    
    fun getAdaptedPhaseName(phase: String): String {
        return taskRepository.getAdaptedPhaseName(phase)
    }
    
    fun clearError() {
        taskRepository.clearError()
    }
    
    fun toggleFilterPanel() {
        _uiState.value = _uiState.value.copy(
            isFilterPanelOpen = !_uiState.value.isFilterPanelOpen
        )
    }
    
    fun openCardDetails(card: Card) {
        _uiState.value = _uiState.value.copy(
            selectedCard = card,
            isCardDetailsOpen = true
        )
    }
    
    fun closeCardDetails() {
        _uiState.value = _uiState.value.copy(
            selectedCard = null,
            isCardDetailsOpen = false
        )
    }
    
    fun getValidPhases(): List<String> {
        return Card.validPhases
    }
    
    fun getCurrentSearchQuery(): String = _searchQuery.value
    fun getCurrentSelectedPhase(): String = _selectedPhase.value
}

data class TaskUiState(
    val selectedCard: Card? = null,
    val isCardDetailsOpen: Boolean = false,
    val isFilterPanelOpen: Boolean = false
)