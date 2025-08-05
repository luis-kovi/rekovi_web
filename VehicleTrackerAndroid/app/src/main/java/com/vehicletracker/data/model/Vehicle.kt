package com.vehicletracker.data.model

import java.util.Date

data class Vehicle(
    val id: String,
    val licensePlate: String,
    val driverName: String,
    val collectorName: String,
    val currentPhase: String,
    val createdAt: Date,
    val collectorEmail: String,
    val responsibleCompany: String,
    val vehicleModel: String,
    val contactPhone: String,
    val optionalPhone: String?,
    val customerEmail: String,
    val registrationAddress: String,
    val collectionAddress: String,
    val mapLink: String?,
    val rentalOrigin: String,
    val collectionValue: String?,
    val additionalKmCost: String?,
    val publicUrl: String?
)

enum class VehiclePhase(val displayName: String, val color: String) {
    COLLECTION_QUEUE("Fila de Recolha", "#6366F1"),
    APPROVE_COST("Aprovar Custo de Recolha", "#F59E0B"),
    ATTEMPT_1("Tentativa 1 de Recolha", "#10B981"),
    ATTEMPT_2("Tentativa 2 de Recolha", "#F97316"),
    ATTEMPT_3("Tentativa 3 de Recolha", "#EF4444"),
    UNLOCK_VEHICLE("Desbloquear Veículo", "#8B5CF6"),
    REQUEST_TOW("Solicitar Guincho", "#EC4899"),
    NEW_ATTEMPT("Nova tentativa de recolha", "#06B6D4"),
    DELIVERY_CONFIRMATION("Confirmação de Entrega no Pátio", "#22C55E");

    companion object {
        fun fromDisplayName(name: String): VehiclePhase? {
            return values().find { it.displayName == name }
        }
    }
}

enum class PermissionType {
    ADMIN,
    KOVI,
    ATIVA,
    ONSYSTEM,
    CHOFER,
    DEFAULT
}