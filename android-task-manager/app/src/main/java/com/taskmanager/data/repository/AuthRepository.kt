package com.taskmanager.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.taskmanager.domain.model.AuthRequest
import com.taskmanager.domain.model.AuthResponse
import com.taskmanager.domain.model.User
import com.taskmanager.network.SupabaseApiService
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: SupabaseApiService,
    @ApplicationContext private val context: Context
) {
    private val prefs: SharedPreferences = 
        context.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
    
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: Flow<User?> = _currentUser.asStateFlow()
    
    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: Flow<Boolean> = _isLoggedIn.asStateFlow()
    
    init {
        checkSavedAuth()
    }
    
    private fun checkSavedAuth() {
        val token = getAccessToken()
        val userId = prefs.getString("user_id", null)
        val userEmail = prefs.getString("user_email", null)
        
        if (token != null && userId != null && userEmail != null) {
            // Criar user básico do cache
            val user = User(
                id = userId,
                email = userEmail
            )
            _currentUser.value = user
            _isLoggedIn.value = true
        }
    }
    
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val request = AuthRequest(email, password)
            val response = apiService.login(request)
            
            if (response.isSuccessful) {
                val authResponse = response.body()
                if (authResponse?.accessToken != null) {
                    saveAuthData(authResponse)
                    _currentUser.value = authResponse.user
                    _isLoggedIn.value = true
                    Result.success(authResponse)
                } else {
                    Result.failure(Exception("Token não encontrado"))
                }
            } else {
                Result.failure(Exception("Erro de login: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun logout() {
        try {
            val token = getAccessToken()
            if (token != null) {
                apiService.logout("Bearer $token")
            }
        } catch (e: Exception) {
            // Continua o logout mesmo se a API falhar
        } finally {
            clearAuthData()
            _currentUser.value = null
            _isLoggedIn.value = false
        }
    }
    
    suspend fun getCurrentUser(): Result<User> {
        return try {
            val token = getAccessToken()
            if (token != null) {
                val response = apiService.getCurrentUser("Bearer $token")
                if (response.isSuccessful) {
                    val user = response.body()
                    if (user != null) {
                        _currentUser.value = user
                        saveUserData(user)
                        Result.success(user)
                    } else {
                        Result.failure(Exception("Usuário não encontrado"))
                    }
                } else {
                    Result.failure(Exception("Erro ao buscar usuário"))
                }
            } else {
                Result.failure(Exception("Token não encontrado"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun getAccessToken(): String? {
        return prefs.getString("access_token", null)
    }
    
    fun getRefreshToken(): String? {
        return prefs.getString("refresh_token", null)
    }
    
    private fun saveAuthData(authResponse: AuthResponse) {
        prefs.edit().apply {
            putString("access_token", authResponse.accessToken)
            putString("refresh_token", authResponse.refreshToken)
            putString("token_type", authResponse.tokenType)
            authResponse.user?.let { user ->
                putString("user_id", user.id)
                putString("user_email", user.email)
            }
            apply()
        }
    }
    
    private fun saveUserData(user: User) {
        prefs.edit().apply {
            putString("user_id", user.id)
            putString("user_email", user.email)
            user.userMetadata?.fullName?.let { 
                putString("user_full_name", it) 
            }
            user.appMetadata?.permissionType?.let { 
                putString("permission_type", it) 
            }
            apply()
        }
    }
    
    private fun clearAuthData() {
        prefs.edit().clear().apply()
    }
    
    fun getPermissionType(): String? {
        return prefs.getString("permission_type", null)
    }
    
    fun getUserFullName(): String? {
        return prefs.getString("user_full_name", null)
    }
}