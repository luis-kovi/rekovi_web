package com.taskmanager.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val email: String,
    @SerialName("user_metadata")
    val userMetadata: UserMetadata? = null,
    @SerialName("app_metadata")
    val appMetadata: AppMetadata? = null
)

@Serializable
data class UserMetadata(
    @SerialName("full_name")
    val fullName: String? = null,
    @SerialName("avatar_url")
    val avatarUrl: String? = null
)

@Serializable
data class AppMetadata(
    @SerialName("permissionType")
    val permissionType: String? = null
)

enum class PermissionType(val value: String) {
    ADMIN("admin"),
    KOVI("kovi"),
    ATIVA("ativa"),
    ONSYSTEM("onsystem"),
    CHOFER("chofer"),
    DEFAULT("default");
    
    companion object {
        fun fromString(value: String?): PermissionType {
            return values().find { it.value.equals(value, ignoreCase = true) } ?: DEFAULT
        }
    }
}