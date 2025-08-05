package com.taskmanager.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Card(
    @SerialName("card_id")
    val id: String,
    
    @SerialName("placa_veiculo")
    val placa: String,
    
    @SerialName("nome_driver")
    val nomeDriver: String,
    
    @SerialName("nome_chofer_recolha")
    val chofer: String,
    
    @SerialName("phase_name")
    val faseAtual: String,
    
    @SerialName("created_at")
    val dataCriacao: String,
    
    @SerialName("email_chofer")
    val emailChofer: String? = null,
    
    @SerialName("empresa_recolha")
    val empresaResponsavel: String? = null,
    
    @SerialName("modelo_veiculo")
    val modeloVeiculo: String? = null,
    
    @SerialName("telefone_contato")
    val telefoneContato: String? = null,
    
    @SerialName("telefone_opcional")
    val telefoneOpcional: String? = null,
    
    @SerialName("email_cliente")
    val emailCliente: String? = null,
    
    @SerialName("endereco_cadastro")
    val enderecoCadastro: String? = null,
    
    @SerialName("endereco_recolha")
    val enderecoRecolha: String? = null,
    
    @SerialName("link_mapa")
    val linkMapa: String? = null,
    
    @SerialName("origem_locacao")
    val origemLocacao: String? = null,
    
    @SerialName("valor_recolha")
    val valorRecolha: String? = null,
    
    @SerialName("custo_km_adicional")
    val custoKmAdicional: String? = null,
    
    @SerialName("public_url")
    val urlPublica: String? = null
) {
    companion object {
        val validPhases = listOf(
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
    }
}

data class CardWithSLA(
    val card: Card,
    val sla: Int,
    val slaText: SLAStatus
)

enum class SLAStatus(val text: String) {
    NO_PRAZO("No Prazo"),
    EM_ALERTA("Em Alerta"),
    ATRASADO("Atrasado")
}