package com.vehicletracker.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vehicletracker.data.model.Vehicle
import com.vehicletracker.data.repository.VehicleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

data class VehicleDetailUiState(
    val vehicle: Vehicle? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class VehicleDetailViewModel @Inject constructor(
    private val vehicleRepository: VehicleRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(VehicleDetailUiState())
    val uiState: StateFlow<VehicleDetailUiState> = _uiState.asStateFlow()
    
    fun loadVehicle(vehicleId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                // For demo purposes, creating a mock vehicle
                val mockVehicle = createMockVehicle(vehicleId)
                
                _uiState.update { 
                    it.copy(
                        vehicle = mockVehicle,
                        isLoading = false,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = "Erro ao carregar veículo: ${e.message}"
                    )
                }
            }
        }
    }
    
    fun updateVehiclePhase(newPhase: String) {
        viewModelScope.launch {
            val currentVehicle = _uiState.value.vehicle ?: return@launch
            
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                // For demo purposes, just update the local state
                val updatedVehicle = currentVehicle.copy(currentPhase = newPhase)
                
                _uiState.update { 
                    it.copy(
                        vehicle = updatedVehicle,
                        isLoading = false,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = "Erro ao atualizar fase: ${e.message}"
                    )
                }
            }
        }
    }
    
    private fun createMockVehicle(vehicleId: String): Vehicle {
        return Vehicle(
            id = vehicleId,
            licensePlate = "ABC-1234",
            driverName = "João Silva",
            collectorName = "Maria Santos",
            currentPhase = "Tentativa 2 de Recolha",
            createdAt = Date(System.currentTimeMillis() - 172800000L), // 2 days ago
            collectorEmail = "maria.santos@ativa.com",
            responsibleCompany = "ATIVA",
            vehicleModel = "Toyota Corolla 2022",
            contactPhone = "(11) 98765-4321",
            optionalPhone = "(11) 91234-5678",
            customerEmail = "joao.silva@email.com",
            registrationAddress = "Rua das Flores, 123, Jardim Paulista, São Paulo - SP",
            collectionAddress = "Av. Paulista, 1000, Bela Vista, São Paulo - SP",
            mapLink = "https://maps.google.com/?q=-23.561684,-46.655981",
            rentalOrigin = "App",
            collectionValue = "R$ 350,00",
            additionalKmCost = "R$ 3,50/km",
            publicUrl = "https://vehicletracker.com/track/$vehicleId"
        )
    }
}