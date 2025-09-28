# 📱 Guia de Integração Android - Pastelaria API

## 🎯 Visão Geral

Este guia mostra como integrar sua aplicação Android com a API da Pastelaria otimizada para dispositivos móveis usando Cloudflare D1.

## 🏗️ Arquitetura Recomendada

```
┌─────────────────────────────────────────────────────────────┐
│                    App Android                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │     UI      │  │  ViewModel  │  │    Repository       │  │
│  │ (Compose)   │  │   (MVVM)    │  │   (Clean Arch)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Retrofit  │  │ Room Cache  │  │  Offline Queue      │  │
│  │  (Network)  │  │ (Database)  │  │   (Sync)            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Edge Network                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Workers   │  │     D1      │  │      Cache          │  │
│  │    (API)    │  │ (Database)  │  │   (Performance)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Dependências Necessárias

### **build.gradle (Module: app)**
```kotlin
dependencies {
    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'
    
    // Database (Cache Local)
    implementation 'androidx.room:room-runtime:2.5.0'
    implementation 'androidx.room:room-ktx:2.5.0'
    kapt 'androidx.room:room-compiler:2.5.0'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    
    // ViewModel & LiveData
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
    
    // Work Manager (Background Sync)
    implementation 'androidx.work:work-runtime-ktx:2.8.1'
    
    // Network State
    implementation 'androidx.lifecycle:lifecycle-process:2.7.0'
    
    // JSON
    implementation 'com.google.code.gson:gson:2.10.1'
    
    // Image Loading
    implementation 'com.github.bumptech.glide:glide:4.15.1'
    
    // Compose (UI)
    implementation 'androidx.compose.ui:ui:1.5.4'
    implementation 'androidx.compose.material3:material3:1.1.2'
    implementation 'androidx.activity:activity-compose:1.8.0'
}
```

## 🌐 Configuração da API

### **1. ApiConfig.kt**
```kotlin
object ApiConfig {
    const val BASE_URL = "https://pastelaria-api.SEU_SUBDOMAIN.workers.dev/"
    const val TIMEOUT_SECONDS = 30L
    
    // Headers padrão para otimização mobile
    fun getDefaultHeaders(): Map<String, String> {
        return mapOf(
            "Content-Type" to "application/json",
            "X-Device-Type" to "mobile",
            "X-Connection-Type" to NetworkUtils.getConnectionType(),
            "X-App-Version" to BuildConfig.VERSION_NAME,
            "User-Agent" to "PastelariaMobile/${BuildConfig.VERSION_NAME} Android"
        )
    }
}
```

### **2. NetworkUtils.kt**
```kotlin
class NetworkUtils(private val context: Context) {
    
    companion object {
        fun getConnectionType(): String {
            val context = MyApplication.instance
            val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val network = connectivityManager.activeNetwork ?: return "offline"
                val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return "offline"
                
                return when {
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> {
                        getCellularType(context)
                    }
                    else -> "unknown"
                }
            } else {
                @Suppress("DEPRECATION")
                val networkInfo = connectivityManager.activeNetworkInfo
                return when (networkInfo?.type) {
                    ConnectivityManager.TYPE_WIFI -> "wifi"
                    ConnectivityManager.TYPE_MOBILE -> getCellularType(context)
                    else -> "offline"
                }
            }
        }
        
        private fun getCellularType(context: Context): String {
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            
            return when (telephonyManager.networkType) {
                TelephonyManager.NETWORK_TYPE_LTE,
                TelephonyManager.NETWORK_TYPE_NR -> "4g"
                TelephonyManager.NETWORK_TYPE_HSDPA,
                TelephonyManager.NETWORK_TYPE_HSUPA,
                TelephonyManager.NETWORK_TYPE_HSPA,
                TelephonyManager.NETWORK_TYPE_HSPAP,
                TelephonyManager.NETWORK_TYPE_UMTS -> "3g"
                TelephonyManager.NETWORK_TYPE_EDGE,
                TelephonyManager.NETWORK_TYPE_GPRS -> "2g"
                else -> "unknown"
            }
        }
    }
    
    fun isOnline(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork
            val capabilities = connectivityManager.getNetworkCapabilities(network)
            capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
        } else {
            @Suppress("DEPRECATION")
            connectivityManager.activeNetworkInfo?.isConnected == true
        }
    }
    
    fun isWiFi(): Boolean {
        return getConnectionType() == "wifi"
    }
    
    fun isFastConnection(): Boolean {
        return getConnectionType() in listOf("wifi", "4g")
    }
}
```

### **3. ApiService.kt**
```kotlin
interface ApiService {
    
    // Produtos
    @GET("api/v1/produtos")
    suspend fun getProdutos(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("categoria") categoria: String? = null,
        @Query("ativo") ativo: Boolean? = null,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<Produto>>>
    
    @GET("api/v1/produtos/{id}")
    suspend fun getProduto(@Path("id") id: String): Response<ApiResponse<Produto>>
    
    @POST("api/v1/produtos")
    suspend fun createProduto(@Body produto: CreateProdutoRequest): Response<ApiResponse<Produto>>
    
    @PUT("api/v1/produtos/{id}")
    suspend fun updateProduto(@Path("id") id: String, @Body produto: UpdateProdutoRequest): Response<ApiResponse<Produto>>
    
    @DELETE("api/v1/produtos/{id}")
    suspend fun deleteProduto(@Path("id") id: String): Response<ApiResponse<Unit>>
    
    // Sabores
    @GET("api/v1/sabores")
    suspend fun getSabores(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("categoria") categoria: String? = null,
        @Query("ativo") ativo: Boolean? = null
    ): Response<ApiResponse<List<Sabor>>>
    
    @GET("api/v1/sabores/categorias")
    suspend fun getSaboresCategorias(): Response<ApiResponse<List<String>>>
    
    // Tamanhos
    @GET("api/v1/tamanhos")
    suspend fun getTamanhos(
        @Query("ativo") ativo: Boolean? = null
    ): Response<ApiResponse<List<Tamanho>>>
    
    @POST("api/v1/tamanhos/calcular-preco")
    suspend fun calcularPreco(@Body request: CalcularPrecoRequest): Response<ApiResponse<CalcularPrecoResponse>>
    
    // Pedidos
    @GET("api/v1/pedidos")
    suspend fun getPedidos(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("status") status: String? = null,
        @Query("data_inicio") dataInicio: String? = null,
        @Query("data_fim") dataFim: String? = null
    ): Response<ApiResponse<List<Pedido>>>
    
    @GET("api/v1/pedidos/{id}")
    suspend fun getPedido(@Path("id") id: String): Response<ApiResponse<Pedido>>
    
    @POST("api/v1/pedidos")
    suspend fun createPedido(@Body pedido: CreatePedidoRequest): Response<ApiResponse<Pedido>>
    
    @PUT("api/v1/pedidos/{id}/status")
    suspend fun updatePedidoStatus(@Path("id") id: String, @Body status: UpdateStatusRequest): Response<ApiResponse<Pedido>>
    
    // Sincronização
    @POST("api/v1/sync/upload")
    suspend fun uploadOfflineData(@Body data: OfflineDataRequest): Response<ApiResponse<SyncResponse>>
    
    @GET("api/v1/sync/download")
    suspend fun downloadUpdatedData(
        @Query("last_sync") lastSync: String,
        @Query("tables") tables: String? = null
    ): Response<ApiResponse<SyncDataResponse>>
    
    @GET("api/v1/sync/status")
    suspend fun getSyncStatus(): Response<ApiResponse<SyncStatusResponse>>
    
    // Autenticação
    @POST("api/v1/auth/login")
    suspend fun login(@Body credentials: LoginRequest): Response<ApiResponse<LoginResponse>>
    
    // Health Check
    @GET("api/v1/health")
    suspend fun healthCheck(): Response<ApiResponse<HealthResponse>>
}
```

## 🗄️ Cache Local com Room

### **1. Entities**
```kotlin
@Entity(tableName = "produtos_cache")
data class ProdutoCache(
    @PrimaryKey val id: String,
    val nome: String,
    val categoria: String,
    val preco: Double,
    val descricao: String?,
    val ativo: Boolean,
    val imagem: String?,
    val lastSync: Long,
    val expiresAt: Long,
    val isDeleted: Boolean = false
)

@Entity(tableName = "offline_operations")
data class OfflineOperation(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: String, // CREATE, UPDATE, DELETE
    val table: String, // produtos, pedidos, etc
    val recordId: String?,
    val data: String, // JSON dos dados
    val timestamp: Long,
    val synced: Boolean = false
)

@Entity(tableName = "sync_metadata")
data class SyncMetadata(
    @PrimaryKey val key: String,
    val value: String,
    val lastUpdated: Long
)
```

### **2. DAOs**
```kotlin
@Dao
interface ProdutoCacheDao {
    @Query("SELECT * FROM produtos_cache WHERE isDeleted = 0 AND expiresAt > :currentTime")
    suspend fun getValidProdutos(currentTime: Long = System.currentTimeMillis()): List<ProdutoCache>
    
    @Query("SELECT * FROM produtos_cache WHERE id = :id AND isDeleted = 0 AND expiresAt > :currentTime")
    suspend fun getProduto(id: String, currentTime: Long = System.currentTimeMillis()): ProdutoCache?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProdutos(produtos: List<ProdutoCache>)
    
    @Query("DELETE FROM produtos_cache WHERE expiresAt < :currentTime")
    suspend fun deleteExpired(currentTime: Long = System.currentTimeMillis())
    
    @Query("DELETE FROM produtos_cache")
    suspend fun clearAll()
}

@Dao
interface OfflineOperationDao {
    @Query("SELECT * FROM offline_operations WHERE synced = 0 ORDER BY timestamp ASC")
    suspend fun getPendingOperations(): List<OfflineOperation>
    
    @Insert
    suspend fun insertOperation(operation: OfflineOperation)
    
    @Query("UPDATE offline_operations SET synced = 1 WHERE id = :id")
    suspend fun markAsSynced(id: Long)
    
    @Query("DELETE FROM offline_operations WHERE synced = 1 AND timestamp < :cutoff")
    suspend fun deleteSyncedOlderThan(cutoff: Long)
}

@Dao
interface SyncMetadataDao {
    @Query("SELECT * FROM sync_metadata WHERE key = :key")
    suspend fun getMetadata(key: String): SyncMetadata?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setMetadata(metadata: SyncMetadata)
    
    @Query("SELECT value FROM sync_metadata WHERE key = 'last_sync'")
    suspend fun getLastSyncTime(): String?
}
```

### **3. Database**
```kotlin
@Database(
    entities = [ProdutoCache::class, OfflineOperation::class, SyncMetadata::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun produtoCacheDao(): ProdutoCacheDao
    abstract fun offlineOperationDao(): OfflineOperationDao
    abstract fun syncMetadataDao(): SyncMetadataDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "pastelaria_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
```

## 🔄 Repository Pattern

### **ProdutoRepository.kt**
```kotlin
class ProdutoRepository(
    private val apiService: ApiService,
    private val produtoCacheDao: ProdutoCacheDao,
    private val offlineOperationDao: OfflineOperationDao,
    private val networkUtils: NetworkUtils
) {
    
    suspend fun getProdutos(
        page: Int = 1,
        limit: Int = 20,
        categoria: String? = null,
        forceRefresh: Boolean = false
    ): Result<List<Produto>> {
        return try {
            // Tentar cache primeiro se não forçar refresh
            if (!forceRefresh && !networkUtils.isOnline()) {
                val cached = produtoCacheDao.getValidProdutos()
                if (cached.isNotEmpty()) {
                    return Result.success(cached.map { it.toProduto() })
                }
            }
            
            // Buscar da API
            if (networkUtils.isOnline()) {
                val response = apiService.getProdutos(page, limit, categoria, true)
                if (response.isSuccessful && response.body()?.success == true) {
                    val produtos = response.body()!!.data
                    
                    // Salvar no cache
                    val cacheExpiry = if (networkUtils.isFastConnection()) {
                        System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(10)
                    } else {
                        System.currentTimeMillis() + TimeUnit.HOURS.toMillis(1)
                    }
                    
                    val produtosCache = produtos.map { produto ->
                        ProdutoCache(
                            id = produto.id,
                            nome = produto.nome,
                            categoria = produto.categoria,
                            preco = produto.preco,
                            descricao = produto.descricao,
                            ativo = produto.ativo,
                            imagem = produto.imagem,
                            lastSync = System.currentTimeMillis(),
                            expiresAt = cacheExpiry
                        )
                    }
                    
                    produtoCacheDao.insertProdutos(produtosCache)
                    Result.success(produtos)
                } else {
                    // Fallback para cache se API falhar
                    val cached = produtoCacheDao.getValidProdutos()
                    if (cached.isNotEmpty()) {
                        Result.success(cached.map { it.toProduto() })
                    } else {
                        Result.failure(Exception("Erro ao carregar produtos"))
                    }
                }
            } else {
                // Offline - usar cache
                val cached = produtoCacheDao.getValidProdutos()
                if (cached.isNotEmpty()) {
                    Result.success(cached.map { it.toProduto() })
                } else {
                    Result.failure(Exception("Sem conexão e sem dados em cache"))
                }
            }
        } catch (e: Exception) {
            // Fallback para cache em caso de erro
            val cached = produtoCacheDao.getValidProdutos()
            if (cached.isNotEmpty()) {
                Result.success(cached.map { it.toProduto() })
            } else {
                Result.failure(e)
            }
        }
    }
    
    suspend fun createProduto(produto: CreateProdutoRequest): Result<Produto> {
        return try {
            if (networkUtils.isOnline()) {
                val response = apiService.createProduto(produto)
                if (response.isSuccessful && response.body()?.success == true) {
                    Result.success(response.body()!!.data)
                } else {
                    // Salvar operação offline
                    saveOfflineOperation("CREATE", "produtos", null, produto)
                    Result.failure(Exception("Salvo para sincronização posterior"))
                }
            } else {
                // Salvar operação offline
                saveOfflineOperation("CREATE", "produtos", null, produto)
                Result.failure(Exception("Operação salva para quando houver conexão"))
            }
        } catch (e: Exception) {
            // Salvar operação offline
            saveOfflineOperation("CREATE", "produtos", null, produto)
            Result.failure(e)
        }
    }
    
    private suspend fun saveOfflineOperation(type: String, table: String, recordId: String?, data: Any) {
        val operation = OfflineOperation(
            type = type,
            table = table,
            recordId = recordId,
            data = Gson().toJson(data),
            timestamp = System.currentTimeMillis()
        )
        offlineOperationDao.insertOperation(operation)
    }
}
```

## 🔄 Sincronização Offline

### **SyncManager.kt**
```kotlin
class SyncManager(
    private val apiService: ApiService,
    private val offlineOperationDao: OfflineOperationDao,
    private val syncMetadataDao: SyncMetadataDao,
    private val networkUtils: NetworkUtils
) {
    
    suspend fun syncOfflineOperations(): Result<SyncResponse> {
        if (!networkUtils.isOnline()) {
            return Result.failure(Exception("Sem conexão para sincronizar"))
        }
        
        try {
            val pendingOperations = offlineOperationDao.getPendingOperations()
            
            if (pendingOperations.isEmpty()) {
                return Result.success(SyncResponse(0, 0, emptyList()))
            }
            
            // Preparar dados para upload
            val offlineData = OfflineDataRequest(
                operations = pendingOperations.map { op ->
                    OfflineOperationRequest(
                        type = op.type,
                        table = op.table,
                        recordId = op.recordId,
                        data = op.data,
                        timestamp = op.timestamp
                    )
                }
            )
            
            // Enviar para API
            val response = apiService.uploadOfflineData(offlineData)
            
            if (response.isSuccessful && response.body()?.success == true) {
                val syncResponse = response.body()!!.data
                
                // Marcar operações como sincronizadas
                pendingOperations.forEach { op ->
                    offlineOperationDao.markAsSynced(op.id)
                }
                
                // Atualizar timestamp de sincronização
                syncMetadataDao.setMetadata(
                    SyncMetadata(
                        key = "last_sync",
                        value = System.currentTimeMillis().toString(),
                        lastUpdated = System.currentTimeMillis()
                    )
                )
                
                Result.success(syncResponse)
            } else {
                Result.failure(Exception("Erro na sincronização"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun downloadUpdatedData(): Result<SyncDataResponse> {
        if (!networkUtils.isOnline()) {
            return Result.failure(Exception("Sem conexão"))
        }
        
        try {
            val lastSync = syncMetadataDao.getLastSyncTime() ?: "0"
            val response = apiService.downloadUpdatedData(lastSync)
            
            if (response.isSuccessful && response.body()?.success == true) {
                val syncData = response.body()!!.data
                
                // Processar dados atualizados
                // (implementar lógica específica para cada tabela)
                
                Result.success(syncData)
            } else {
                Result.failure(Exception("Erro ao baixar dados atualizados"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

## 🔧 Background Sync com WorkManager

### **SyncWorker.kt**
```kotlin
class SyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            val syncManager = (applicationContext as MyApplication).syncManager
            
            // Sincronizar operações offline
            val syncResult = syncManager.syncOfflineOperations()
            
            if (syncResult.isSuccess) {
                // Baixar dados atualizados
                syncManager.downloadUpdatedData()
                Result.success()
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            Result.failure()
        }
    }
    
    companion object {
        const val WORK_NAME = "sync_work"
        
        fun schedulePeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()
            
            val syncWork = PeriodicWorkRequestBuilder<SyncWorker>(
                15, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.LINEAR,
                    PeriodicWorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS
                )
                .build()
            
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    WORK_NAME,
                    ExistingPeriodicWorkPolicy.KEEP,
                    syncWork
                )
        }
    }
}
```

## 🎨 UI com Jetpack Compose

### **ProdutoListScreen.kt**
```kotlin
@Composable
fun ProdutoListScreen(
    viewModel: ProdutoViewModel = hiltViewModel()
) {
    val produtos by viewModel.produtos.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isOffline by viewModel.isOffline.collectAsState()
    
    LazyColumn {
        if (isOffline) {
            item {
                OfflineBanner()
            }
        }
        
        if (isLoading) {
            item {
                LoadingIndicator()
            }
        }
        
        items(produtos) { produto ->
            ProdutoItem(
                produto = produto,
                onClick = { viewModel.selectProduto(produto.id) }
            )
        }
    }
}

@Composable
fun OfflineBanner() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.CloudOff,
                contentDescription = "Offline",
                tint = MaterialTheme.colorScheme.onErrorContainer
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                "Modo offline - Dados podem estar desatualizados",
                color = MaterialTheme.colorScheme.onErrorContainer
            )
        }
    }
}
```

## 📊 Monitoramento e Analytics

### **AnalyticsManager.kt**
```kotlin
class AnalyticsManager {
    
    fun trackApiCall(endpoint: String, success: Boolean, responseTime: Long) {
        // Implementar tracking de performance
        val event = mapOf(
            "endpoint" to endpoint,
            "success" to success,
            "response_time" to responseTime,
            "connection_type" to NetworkUtils.getConnectionType(),
            "timestamp" to System.currentTimeMillis()
        )
        
        // Enviar para analytics (Firebase, etc.)
    }
    
    fun trackOfflineOperation(type: String, table: String) {
        // Tracking de operações offline
    }
    
    fun trackSyncEvent(success: Boolean, operationsCount: Int) {
        // Tracking de sincronização
    }
}
```

## 🔐 Segurança e Autenticação

### **AuthManager.kt**
```kotlin
class AuthManager(private val context: Context) {
    
    private val prefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
    
    fun saveToken(token: String) {
        prefs.edit()
            .putString("jwt_token", token)
            .putLong("token_saved_at", System.currentTimeMillis())
            .apply()
    }
    
    fun getToken(): String? {
        val token = prefs.getString("jwt_token", null)
        val savedAt = prefs.getLong("token_saved_at", 0)
        
        // Verificar se token não expirou (24 horas)
        if (System.currentTimeMillis() - savedAt > TimeUnit.HOURS.toMillis(24)) {
            clearToken()
            return null
        }
        
        return token
    }
    
    fun clearToken() {
        prefs.edit().clear().apply()
    }
    
    fun isLoggedIn(): Boolean {
        return getToken() != null
    }
}
```

## 🚀 Otimizações de Performance

### **1. Image Loading Otimizado**
```kotlin
@Composable
fun OptimizedImage(
    imageUrl: String?,
    contentDescription: String?,
    modifier: Modifier = Modifier
) {
    val connectionType = remember { NetworkUtils.getConnectionType() }
    
    val optimizedUrl = remember(imageUrl, connectionType) {
        imageUrl?.let { url ->
            when (connectionType) {
                "2g", "3g" -> "$url?w=200&q=60" // Baixa qualidade
                "4g" -> "$url?w=400&q=80" // Média qualidade
                "wifi" -> "$url?w=800&q=90" // Alta qualidade
                else -> url
            }
        }
    }
    
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(optimizedUrl)
            .crossfade(true)
            .memoryCachePolicy(CachePolicy.ENABLED)
            .diskCachePolicy(CachePolicy.ENABLED)
            .build(),
        contentDescription = contentDescription,
        modifier = modifier,
        loading = {
            CircularProgressIndicator()
        },
        error = {
            Icon(Icons.Default.BrokenImage, contentDescription = "Erro ao carregar")
        }
    )
}
```

### **2. Paginação Inteligente**
```kotlin
class ProdutoViewModel : ViewModel() {
    
    private val _produtos = MutableStateFlow<List<Produto>>(emptyList())
    val produtos = _produtos.asStateFlow()
    
    private var currentPage = 1
    private var isLastPage = false
    
    fun loadMoreProdutos() {
        if (isLastPage) return
        
        viewModelScope.launch {
            val limit = when (NetworkUtils.getConnectionType()) {
                "2g" -> 10
                "3g" -> 15
                "4g", "wifi" -> 20
                else -> 10
            }
            
            val result = repository.getProdutos(
                page = currentPage,
                limit = limit
            )
            
            result.onSuccess { newProdutos ->
                _produtos.value = _produtos.value + newProdutos
                currentPage++
                isLastPage = newProdutos.size < limit
            }
        }
    }
}
```

## 📱 Exemplo de Uso Completo

### **MainActivity.kt**
```kotlin
class MainActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Configurar sincronização em background
        SyncWorker.schedulePeriodicSync(this)
        
        setContent {
            PastelariaMobileTheme {
                PastelariaMobileApp()
            }
        }
    }
}

@Composable
fun PastelariaMobileApp() {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = "produtos"
    ) {
        composable("produtos") {
            ProdutoListScreen(
                onProdutoClick = { produtoId ->
                    navController.navigate("produto/$produtoId")
                }
            )
        }
        
        composable("produto/{produtoId}") { backStackEntry ->
            val produtoId = backStackEntry.arguments?.getString("produtoId")
            ProdutoDetailScreen(produtoId = produtoId)
        }
        
        composable("pedidos") {
            PedidoListScreen()
        }
        
        composable("novo_pedido") {
            NovoPedidoScreen()
        }
    }
}
```

## 🎯 Próximos Passos

1. **Implementar Push Notifications**
2. **Adicionar Analytics Detalhados**
3. **Implementar Testes Automatizados**
4. **Adicionar Suporte a Múltiplos Idiomas**
5. **Implementar Dark Mode**
6. **Adicionar Biometria para Autenticação**

---

**🎉 Sua integração Android está pronta para funcionar de forma otimizada com a API Cloudflare!**

Este guia fornece uma base sólida para uma aplicação Android que funciona perfeitamente tanto online quanto offline, com sincronização automática e otimizações específicas para dispositivos móveis.