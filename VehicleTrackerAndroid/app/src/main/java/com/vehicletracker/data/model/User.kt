package com.vehicletracker.data.model

data class User(
    val id: String,
    val email: String,
    val name: String?,
    val permissionType: PermissionType = PermissionType.DEFAULT,
    val company: String? = null
)