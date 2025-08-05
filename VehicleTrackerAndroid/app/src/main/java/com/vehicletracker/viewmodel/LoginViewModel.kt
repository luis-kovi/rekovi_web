package com.vehicletracker.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor() : ViewModel() {
    
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    fun updateEmail(email: String) {
        _uiState.update { it.copy(email = email, error = null) }
    }
    
    fun updatePassword(password: String) {
        _uiState.update { it.copy(password = password, error = null) }
    }
    
    suspend fun login(onSuccess: () -> Unit) {
        val currentState = _uiState.value
        
        if (currentState.email.isBlank() || currentState.password.isBlank()) {
            _uiState.update { it.copy(error = "Por favor, preencha todos os campos") }
            return
        }
        
        _uiState.update { it.copy(isLoading = true, error = null) }
        
        // Simulate network delay
        delay(1500)
        
        // For demo purposes, accept any email/password
        _uiState.update { it.copy(isLoading = false) }
        onSuccess()
    }
}