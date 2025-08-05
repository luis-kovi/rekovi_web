package com.vehicletracker.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vehicletracker.data.model.User
import com.vehicletracker.data.model.Vehicle
import com.vehicletracker.data.model.PermissionType
import com.vehicletracker.data.repository.VehicleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

data class VehicleListUiState(
    val vehicles: List<Vehicle> = emptyList(),
    val filteredVehicles: List<Vehicle> = emptyList(),
    val selectedPhase: String = "all",
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val user: User? = null
)

@HiltViewModel
class VehicleListViewModel @Inject constructor(
    private val vehicleRepository: VehicleRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(VehicleListUiState())
    val uiState: StateFlow<VehicleListUiState> = _uiState.asStateFlow()
    
    init {
        loadVehicles()
        loadUser()
    }
    
    private fun loadUser() {
        // For demo purposes, creating a mock user
        _uiState.update { it.copy(
            user = User(
                id = "1",
                email = "demo@vehicletracker.com",
                name = "Demo User",
                permissionType = PermissionType.ADMIN
            )
        )}
    }
    
    private fun loadVehicles() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                // For demo purposes, creating mock data
                val mockVehicles = createMockVehicles()
                
                _uiState.update { 
                    it.copy(
                        vehicles = mockVehicles,
                        filteredVehicles = filterVehicles(mockVehicles, it.selectedPhase, it.searchQuery),
                        isLoading = false,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = "Erro ao carregar veículos: ${e.message}"
                    )
                }
            }
        }
    }
    
    fun refreshVehicles() {
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true) }
            delay(1500) // Simulate network delay
            loadVehicles()
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }
    
    fun updateSelectedPhase(phase: String) {
        _uiState.update { state ->
            state.copy(
                selectedPhase = phase,
                filteredVehicles = filterVehicles(state.vehicles, phase, state.searchQuery)
            )
        }
    }
    
    fun updateSearchQuery(query: String) {
        _uiState.update { state ->
            state.copy(
                searchQuery = query,
                filteredVehicles = filterVehicles(state.vehicles, state.selectedPhase, query)
            )
        }
    }
    
    private fun filterVehicles(
        vehicles: List<Vehicle>,
        selectedPhase: String,
        searchQuery: String
    ): List<Vehicle> {
        return vehicles
            .filter { vehicle ->
                (selectedPhase == "all" || vehicle.currentPhase == selectedPhase) &&
                (searchQuery.isBlank() || 
                 vehicle.licensePlate.contains(searchQuery, ignoreCase = true) ||
                 vehicle.driverName.contains(searchQuery, ignoreCase = true) ||
                 vehicle.collectorName.contains(searchQuery, ignoreCase = true))
            }
    }
    
    private fun createMockVehicles(): List<Vehicle> {
        val phases = listOf(
            "Fila de Recolha",
            "Aprovar Custo de Recolha",
            "Tentativa 1 de Recolha",
            "Tentativa 2 de Recolha",
            "Tentativa 3 de Recolha",
            "Desbloquear Veículo",
            "Solicitar Guincho",
            "Nova tentativa de recolha",
            "Confirmação de Entrega no Pátio"
        )
        
        val companies = listOf("ATIVA", "ONSYSTEM", "KOVI")
        val models = listOf("Toyota Corolla", "Honda Civic", "Nissan Sentra", "VW Polo", "Fiat Argo")
        val names = listOf("João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa", "Carlos Pereira")
        
        return List(20) { index ->
            val randomPhase = phases.random()
            val randomCompany = companies.random()
            val randomModel = models.random()
            val randomDriver = names.random()
            val randomCollector = names.random()
            
            Vehicle(
                id = "VH-${1000 + index}",
                licensePlate = "ABC-${1234 + index}",
                driverName = randomDriver,
                collectorName = randomCollector,
                currentPhase = randomPhase,
                createdAt = Date(System.currentTimeMillis() - (index * 86400000L)),
                collectorEmail = "${randomCollector.lowercase().replace(" ", ".")}@$randomCompany.com",
                responsibleCompany = randomCompany,
                vehicleModel = randomModel,
                contactPhone = "(11) 9${(80000000..99999999).random()}",
                optionalPhone = if (index % 3 == 0) "(11) 9${(80000000..99999999).random()}" else null,
                customerEmail = "${randomDriver.lowercase().replace(" ", ".")}@email.com",
                registrationAddress = "Rua ${names.random()}, ${(100..999).random()}, São Paulo - SP",
                collectionAddress = "Av. ${names.random()}, ${(100..999).random()}, São Paulo - SP",
                mapLink = "https://maps.google.com/?q=-23.550520,-46.633308",
                rentalOrigin = listOf("App", "Site", "Parceiro").random(),
                collectionValue = if (index % 2 == 0) "R$ ${(100..500).random()},00" else null,
                additionalKmCost = if (index % 4 == 0) "R$ ${(2..5).random()},00/km" else null,
                publicUrl = "https://vehicletracker.com/track/VH-${1000 + index}"
            )
        }
    }
}