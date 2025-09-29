var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-m30Ttn/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// node_modules/itty-router/index.mjs
var t = /* @__PURE__ */ __name(({ base: e = "", routes: t2 = [], ...r2 } = {}) => ({ __proto__: new Proxy({}, { get: /* @__PURE__ */ __name((r3, o2, a, s) => (r4, ...c) => t2.push([o2.toUpperCase?.(), RegExp(`^${(s = (e + r4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), c, s]) && a, "get") }), routes: t2, ...r2, async fetch(e2, ...o2) {
  let a, s, c = new URL(e2.url), n = e2.query = { __proto__: null };
  for (let [e3, t3] of c.searchParams) n[e3] = n[e3] ? [].concat(n[e3], t3) : t3;
  e: try {
    for (let t3 of r2.before || []) if (null != (a = await t3(e2.proxy ?? e2, ...o2))) break e;
    t: for (let [r3, n2, l, i] of t2) if ((r3 == e2.method || "ALL" == r3) && (s = c.pathname.match(n2))) {
      e2.params = s.groups || {}, e2.route = i;
      for (let t3 of l) if (null != (a = await t3(e2.proxy ?? e2, ...o2))) break t;
    }
  } catch (t3) {
    if (!r2.catch) throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  try {
    for (let t3 of r2.finally || []) a = await t3(a, e2.proxy ?? e2, ...o2) ?? a;
  } catch (t3) {
    if (!r2.catch) throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  return a;
} }), "t");
var r = /* @__PURE__ */ __name((e = "text/plain; charset=utf-8", t2) => (r2, o2 = {}) => {
  if (void 0 === r2 || r2 instanceof Response) return r2;
  const a = new Response(t2?.(r2) ?? r2, o2.url ? void 0 : o2);
  return a.headers.set("content-type", e), a;
}, "r");
var o = r("application/json; charset=utf-8", JSON.stringify);
var p = r("text/plain; charset=utf-8", String);
var f = r("text/html");
var u = r("image/jpeg");
var h = r("image/png");
var g = r("image/webp");

// src/utils/cors.js
var corsHeaders2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Device-Type, X-App-Version",
  "Access-Control-Max-Age": "86400",
  // 24 horas para reduzir preflight requests
  "Access-Control-Expose-Headers": "X-Cache, X-Rate-Limit-Remaining, X-Response-Time"
};
function handleCORS(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders2
    });
  }
}
__name(handleCORS, "handleCORS");
function addCORSHeaders(response) {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders2).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
__name(addCORSHeaders, "addCORSHeaders");

// src/middleware/auth.js
function verifyToken(token, secret) {
  try {
    const [header, payload, signature] = token.split(".");
    const expectedSignature = btoa(`${header}.${payload}.${secret}`);
    if (signature !== expectedSignature) {
      return null;
    }
    const decodedPayload = JSON.parse(atob(payload));
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1e3) {
      return null;
    }
    return decodedPayload;
  } catch (error) {
    return null;
  }
}
__name(verifyToken, "verifyToken");
async function authenticateRequest2(request, env, ctx) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({
        error: "Token de acesso requerido",
        code: "MISSING_TOKEN"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const token = authHeader.substring(7);
    const secret = env.JWT_SECRET || "default-secret-change-in-production";
    const payload = verifyToken(token, secret);
    if (!payload) {
      return new Response(JSON.stringify({
        error: "Token inv\xE1lido ou expirado",
        code: "INVALID_TOKEN"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    request.user = payload;
    return null;
  } catch (error) {
    console.error("Erro na autentica\xE7\xE3o:", error);
    return new Response(JSON.stringify({
      error: "Erro interno de autentica\xE7\xE3o",
      code: "AUTH_ERROR"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}
__name(authenticateRequest2, "authenticateRequest");
async function optionalAuth(request, env, ctx) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const secret = env.JWT_SECRET || "default-secret-change-in-production";
      const payload = verifyToken(token, secret);
      if (payload) {
        request.user = payload;
      }
    }
    return null;
  } catch (error) {
    console.error("Erro na autentica\xE7\xE3o opcional:", error);
    return null;
  }
}
__name(optionalAuth, "optionalAuth");

// src/middleware/validation.js
var validators = {
  required: /* @__PURE__ */ __name((value, field) => {
    if (value === void 0 || value === null || value === "") {
      return `Campo '${field}' \xE9 obrigat\xF3rio`;
    }
    return null;
  }, "required"),
  string: /* @__PURE__ */ __name((value, field, options = {}) => {
    if (typeof value !== "string") {
      return `Campo '${field}' deve ser uma string`;
    }
    if (options.minLength && value.length < options.minLength) {
      return `Campo '${field}' deve ter pelo menos ${options.minLength} caracteres`;
    }
    if (options.maxLength && value.length > options.maxLength) {
      return `Campo '${field}' deve ter no m\xE1ximo ${options.maxLength} caracteres`;
    }
    if (options.pattern && !options.pattern.test(value)) {
      return `Campo '${field}' tem formato inv\xE1lido`;
    }
    return null;
  }, "string"),
  number: /* @__PURE__ */ __name((value, field, options = {}) => {
    const num = Number(value);
    if (isNaN(num)) {
      return `Campo '${field}' deve ser um n\xFAmero`;
    }
    if (options.min !== void 0 && num < options.min) {
      return `Campo '${field}' deve ser maior ou igual a ${options.min}`;
    }
    if (options.max !== void 0 && num > options.max) {
      return `Campo '${field}' deve ser menor ou igual a ${options.max}`;
    }
    return null;
  }, "number"),
  boolean: /* @__PURE__ */ __name((value, field) => {
    if (typeof value !== "boolean") {
      return `Campo '${field}' deve ser verdadeiro ou falso`;
    }
    return null;
  }, "boolean"),
  email: /* @__PURE__ */ __name((value, field) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `Campo '${field}' deve ser um email v\xE1lido`;
    }
    return null;
  }, "email"),
  phone: /* @__PURE__ */ __name((value, field) => {
    const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
    if (!phoneRegex.test(value)) {
      return `Campo '${field}' deve ser um telefone v\xE1lido`;
    }
    return null;
  }, "phone"),
  enum: /* @__PURE__ */ __name((value, field, options) => {
    if (!options.values.includes(value)) {
      return `Campo '${field}' deve ser um dos valores: ${options.values.join(", ")}`;
    }
    return null;
  }, "enum"),
  array: /* @__PURE__ */ __name((value, field, options = {}) => {
    if (!Array.isArray(value)) {
      return `Campo '${field}' deve ser uma lista`;
    }
    if (options.minLength && value.length < options.minLength) {
      return `Campo '${field}' deve ter pelo menos ${options.minLength} itens`;
    }
    if (options.maxLength && value.length > options.maxLength) {
      return `Campo '${field}' deve ter no m\xE1ximo ${options.maxLength} itens`;
    }
    return null;
  }, "array")
};
var schemas = {
  produto: {
    nome: [validators.required, (v, f2) => validators.string(v, f2, { minLength: 2, maxLength: 100 })],
    categoria: [validators.required, (v, f2) => validators.enum(v, f2, { values: ["Pizza", "Pastel", "Bebida", "Sobremesa"] })],
    preco: [validators.required, (v, f2) => validators.number(v, f2, { min: 0 })],
    descricao: [(v, f2) => v ? validators.string(v, f2, { maxLength: 500 }) : null],
    ativo: [(v, f2) => v !== void 0 ? validators.boolean(v, f2) : null],
    imagem: [(v, f2) => v ? validators.string(v, f2, { maxLength: 255 }) : null]
  },
  sabor: {
    nome: [validators.required, (v, f2) => validators.string(v, f2, { minLength: 2, maxLength: 100 })],
    preco_adicional: [(v, f2) => v !== void 0 ? validators.number(v, f2, { min: 0 }) : null],
    descricao: [(v, f2) => v ? validators.string(v, f2, { maxLength: 500 }) : null],
    ativo: [(v, f2) => v !== void 0 ? validators.boolean(v, f2) : null],
    categoria: [(v, f2) => v ? validators.enum(v, f2, { values: ["Doce", "Salgado", "Especial"] }) : null]
  },
  tamanho: {
    nome: [validators.required, (v, f2) => validators.string(v, f2, { minLength: 1, maxLength: 50 })],
    multiplicador: [validators.required, (v, f2) => validators.number(v, f2, { min: 0.1, max: 10 })],
    descricao: [(v, f2) => v ? validators.string(v, f2, { maxLength: 200 }) : null],
    ativo: [(v, f2) => v !== void 0 ? validators.boolean(v, f2) : null],
    ordem: [(v, f2) => v !== void 0 ? validators.number(v, f2, { min: 0 }) : null]
  },
  pedido: {
    cliente_nome: [validators.required, (v, f2) => validators.string(v, f2, { minLength: 2, maxLength: 100 })],
    cliente_telefone: [validators.required, validators.phone],
    cliente_endereco: [(v, f2) => v ? validators.string(v, f2, { maxLength: 300 }) : null],
    forma_pagamento: [validators.required, (v, f2) => validators.enum(v, f2, { values: ["Dinheiro", "Cart\xE3o", "PIX", "D\xE9bito", "Cr\xE9dito"] })],
    tipo_entrega: [validators.required, (v, f2) => validators.enum(v, f2, { values: ["Balc\xE3o", "Entrega"] })],
    observacoes: [(v, f2) => v ? validators.string(v, f2, { maxLength: 500 }) : null],
    itens: [validators.required, (v, f2) => validators.array(v, f2, { minLength: 1, maxLength: 20 })]
  },
  itemPedido: {
    produto_id: [validators.required, (v, f2) => validators.number(v, f2, { min: 1 })],
    produto_nome: [validators.required, (v, f2) => validators.string(v, f2, { minLength: 2, maxLength: 100 })],
    quantidade: [validators.required, (v, f2) => validators.number(v, f2, { min: 1, max: 100 })],
    preco_unitario: [validators.required, (v, f2) => validators.number(v, f2, { min: 0 })],
    observacoes: [(v, f2) => v ? validators.string(v, f2, { maxLength: 200 }) : null]
  }
};
function validateData(data, schema) {
  const errors = [];
  for (const [field, validatorFunctions] of Object.entries(schema)) {
    const value = data[field];
    for (const validatorFn of validatorFunctions) {
      const error = validatorFn(value, field);
      if (error) {
        errors.push(error);
        break;
      }
    }
  }
  return errors;
}
__name(validateData, "validateData");
function validateRequest(schema) {
  return async (request, env, ctx) => {
    try {
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        const contentType = request.headers.get("Content-Type");
        if (!contentType || !contentType.includes("application/json")) {
          return new Response(JSON.stringify({
            error: "Content-Type deve ser application/json",
            code: "INVALID_CONTENT_TYPE"
          }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders2
            }
          });
        }
      }
      let data = {};
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        try {
          data = await request.json();
        } catch (error) {
          return new Response(JSON.stringify({
            error: "JSON inv\xE1lido no corpo da requisi\xE7\xE3o",
            code: "INVALID_JSON"
          }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders2
            }
          });
        }
      }
      const errors = validateData(data, schema);
      if (errors.length > 0) {
        return new Response(JSON.stringify({
          error: "Dados inv\xE1lidos",
          code: "VALIDATION_ERROR",
          details: errors
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders2
          }
        });
      }
      request.validatedData = data;
      return null;
    } catch (error) {
      console.error("Erro na valida\xE7\xE3o:", error);
      return new Response(JSON.stringify({
        error: "Erro interno de valida\xE7\xE3o",
        code: "VALIDATION_INTERNAL_ERROR"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
  };
}
__name(validateRequest, "validateRequest");
function validateUrlParams(params, schema) {
  const errors = [];
  for (const [param, validatorFunctions] of Object.entries(schema)) {
    const value = params[param];
    for (const validatorFn of validatorFunctions) {
      const error = validatorFn(value, param);
      if (error) {
        errors.push(error);
        break;
      }
    }
  }
  return errors;
}
__name(validateUrlParams, "validateUrlParams");

// src/utils/cache.js
async function cacheResponse2(db, key, value, ttl = 3600) {
  try {
    const expiresAt = new Date(Date.now() + ttl * 1e3).toISOString();
    await db.prepare(`
      INSERT OR REPLACE INTO cache_dados (chave, valor, expires_at)
      VALUES (?, ?, ?)
    `).bind(key, value, expiresAt).run();
    return true;
  } catch (error) {
    console.error("Erro ao cachear resposta:", error);
    return false;
  }
}
__name(cacheResponse2, "cacheResponse");
async function getCachedResponse2(db, key) {
  try {
    const result = await db.prepare(`
      SELECT valor, expires_at 
      FROM cache_dados 
      WHERE chave = ? AND expires_at > ?
    `).bind(key, (/* @__PURE__ */ new Date()).toISOString()).first();
    return result ? result.valor : null;
  } catch (error) {
    console.error("Erro ao recuperar cache:", error);
    return null;
  }
}
__name(getCachedResponse2, "getCachedResponse");
async function invalidateCache(db, key) {
  try {
    await db.prepare("DELETE FROM cache_dados WHERE chave = ?").bind(key).run();
    return true;
  } catch (error) {
    console.error("Erro ao invalidar cache:", error);
    return false;
  }
}
__name(invalidateCache, "invalidateCache");
async function invalidateCachePattern(db, pattern) {
  try {
    await db.prepare("DELETE FROM cache_dados WHERE chave LIKE ?").bind(pattern).run();
    return true;
  } catch (error) {
    console.error("Erro ao invalidar cache por padr\xE3o:", error);
    return false;
  }
}
__name(invalidateCachePattern, "invalidateCachePattern");
function generateCacheKey(request, params = {}) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;
  const query = url.search;
  const deviceType = request.headers.get("X-Device-Type") || "unknown";
  const appVersion = request.headers.get("X-App-Version") || "unknown";
  const keyParts = [
    method,
    path,
    query,
    deviceType,
    appVersion,
    JSON.stringify(params)
  ];
  return keyParts.join("|");
}
__name(generateCacheKey, "generateCacheKey");
function withCache(handler, ttl = 3600) {
  return async (request, env, ctx) => {
    const cacheKey = generateCacheKey(request);
    const cached = await getCachedResponse2(env.DB, cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "HIT"
        }
      });
    }
    const response = await handler(request, env, ctx);
    if (response.status === 200) {
      const responseText = await response.text();
      await cacheResponse2(env.DB, cacheKey, responseText, ttl);
      return new Response(responseText, {
        status: response.status,
        headers: {
          ...response.headers,
          "X-Cache": "MISS"
        }
      });
    }
    return response;
  };
}
__name(withCache, "withCache");

// src/utils/mobile-optimization.js
function compressResponse(data) {
  const jsonString = JSON.stringify(data);
  const optimized = {
    d: data,
    // dados
    t: Date.now(),
    // timestamp
    c: true
    // compressed flag
  };
  return JSON.stringify(optimized);
}
__name(compressResponse, "compressResponse");
function detectDeviceType(request) {
  const userAgent = request.headers.get("User-Agent") || "";
  const deviceType = request.headers.get("X-Device-Type");
  if (deviceType) {
    return deviceType.toLowerCase();
  }
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    if (/iPad/.test(userAgent)) {
      return "tablet";
    }
    return "mobile";
  }
  return "desktop";
}
__name(detectDeviceType, "detectDeviceType");
function adaptResponseForDevice(data, deviceType) {
  switch (deviceType) {
    case "mobile":
      return {
        ...data,
        // Remover campos desnecessários para mobile
        metadata: void 0,
        debug: void 0,
        // Limitar arrays grandes
        items: Array.isArray(data.items) ? data.items.slice(0, 20) : data.items
      };
    case "tablet":
      return {
        ...data,
        // Permitir mais dados para tablets
        items: Array.isArray(data.items) ? data.items.slice(0, 50) : data.items
      };
    default:
      return data;
  }
}
__name(adaptResponseForDevice, "adaptResponseForDevice");
function createMobilePagination(totalItems, currentPage = 1, itemsPerPage = 20) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;
  return {
    current_page: currentPage,
    items_per_page: itemsPerPage,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: hasNext,
    has_previous: hasPrev,
    next_page: hasNext ? currentPage + 1 : null,
    previous_page: hasPrev ? currentPage - 1 : null
  };
}
__name(createMobilePagination, "createMobilePagination");
function optimizeImageUrl(imageUrl, deviceType, quality = "medium") {
  if (!imageUrl) return "";
  if (imageUrl.includes("imagedelivery.net")) {
    const qualityMap = {
      "low": "q_30,f_auto",
      "medium": "q_60,f_auto",
      "high": "q_80,f_auto"
    };
    const sizeMap = {
      "mobile": "w_400,h_400",
      "tablet": "w_600,h_600",
      "desktop": "w_800,h_800"
    };
    const transforms = [
      qualityMap[quality] || qualityMap.medium,
      sizeMap[deviceType] || sizeMap.mobile
    ].join(",");
    return `${imageUrl}/${transforms}`;
  }
  return imageUrl;
}
__name(optimizeImageUrl, "optimizeImageUrl");
function optimizeForMobile(limit, deviceType) {
  const deviceLimits = {
    "mobile": Math.min(limit, 10),
    "tablet": Math.min(limit, 20),
    "desktop": limit
  };
  return deviceLimits[deviceType] || deviceLimits.mobile;
}
__name(optimizeForMobile, "optimizeForMobile");

// src/routes/produtos.js
var router = t();
router.get("/api/v1/produtos", withCache(async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 20;
    const categoria = url.searchParams.get("categoria");
    const ativo = url.searchParams.get("ativo");
    const search = url.searchParams.get("search");
    const deviceType = detectDeviceType(request);
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    if (categoria) {
      whereConditions.push("categoria = ?");
      params.push(categoria);
    }
    if (ativo !== null && ativo !== void 0) {
      whereConditions.push("ativo = ?");
      params.push(ativo === "true" ? 1 : 0);
    }
    if (search) {
      whereConditions.push("(nome LIKE ? OR descricao LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    const countQuery = `SELECT COUNT(*) as total FROM produtos ${whereClause}`;
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult.total;
    const query = `
      SELECT id, nome, categoria, preco, descricao, ativo, imagem, updated_at
      FROM produtos 
      ${whereClause}
      ORDER BY nome ASC 
      LIMIT ? OFFSET ?
    `;
    const result = await env.DB.prepare(query).bind(...params, limit, offset).all();
    const produtos = result.results || [];
    const produtosOtimizados = produtos.map((produto) => ({
      ...produto,
      imagem: optimizeImageUrl(produto.imagem, deviceType),
      preco: parseFloat(produto.preco)
      // Garantir que preço seja número
    }));
    const pagination = createMobilePagination(total, page, limit);
    const response = {
      success: true,
      data: produtosOtimizados,
      pagination,
      filters: {
        categoria,
        ativo,
        search
      }
    };
    const adaptedResponse = adaptResponseForDevice(response, deviceType);
    return new Response(JSON.stringify(adaptedResponse), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro ao buscar produtos",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}, 300));
router.get("/api/v1/produtos/:id", withCache(async (request, env) => {
  try {
    const { id } = request.params;
    const errors = validateUrlParams({ id }, {
      id: [validators.required, (v, f2) => validators.number(v, f2, { min: 1 })]
    });
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        error: "ID inv\xE1lido",
        details: errors
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const produto = await env.DB.prepare(`
      SELECT id, nome, categoria, preco, descricao, ativo, imagem, created_at, updated_at
      FROM produtos 
      WHERE id = ?
    `).bind(id).first();
    if (!produto) {
      return new Response(JSON.stringify({
        error: "Produto n\xE3o encontrado"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const deviceType = detectDeviceType(request);
    const produtoOtimizado = {
      ...produto,
      imagem: optimizeImageUrl(produto.imagem, deviceType),
      preco: parseFloat(produto.preco)
    };
    return new Response(JSON.stringify({
      success: true,
      data: produtoOtimizado
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro ao buscar produto",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}, 600));
router.post("/api/v1/produtos", optionalAuth, validateRequest(schemas.produto), async (request, env) => {
  try {
    const data = request.validatedData;
    const result = await env.DB.prepare(`
      INSERT INTO produtos (nome, categoria, preco, descricao, ativo, imagem)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      data.nome,
      data.categoria || "Pizza",
      data.preco,
      data.descricao || "",
      data.ativo !== void 0 ? data.ativo ? 1 : 0 : 1,
      data.imagem || ""
    ).run();
    if (result.success) {
      await invalidateCachePattern(env.DB, "GET|/api/v1/produtos%");
      const novoProduto = await env.DB.prepare(`
        SELECT * FROM produtos WHERE id = ?
      `).bind(result.meta.last_row_id).first();
      return new Response(JSON.stringify({
        success: true,
        message: "Produto criado com sucesso",
        data: {
          ...novoProduto,
          preco: parseFloat(novoProduto.preco)
        }
      }), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    throw new Error("Falha ao criar produto");
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro ao criar produto",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
});
router.put("/api/v1/produtos/:id", optionalAuth, validateRequest(schemas.produto), async (request, env) => {
  try {
    const { id } = request.params;
    const data = request.validatedData;
    const errors = validateUrlParams({ id }, {
      id: [validators.required, (v, f2) => validators.number(v, f2, { min: 1 })]
    });
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        error: "ID inv\xE1lido",
        details: errors
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const result = await env.DB.prepare(`
      UPDATE produtos 
      SET nome = ?, categoria = ?, preco = ?, descricao = ?, ativo = ?, imagem = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      data.nome,
      data.categoria || "Pizza",
      data.preco,
      data.descricao || "",
      data.ativo !== void 0 ? data.ativo ? 1 : 0 : 1,
      data.imagem || "",
      id
    ).run();
    if (result.success && result.changes > 0) {
      await invalidateCachePattern(env.DB, "GET|/api/v1/produtos%");
      const produtoAtualizado = await env.DB.prepare(`
        SELECT * FROM produtos WHERE id = ?
      `).bind(id).first();
      return new Response(JSON.stringify({
        success: true,
        message: "Produto atualizado com sucesso",
        data: {
          ...produtoAtualizado,
          preco: parseFloat(produtoAtualizado.preco)
        }
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    return new Response(JSON.stringify({
      error: "Produto n\xE3o encontrado"
    }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro ao atualizar produto",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
});
router.delete("/api/v1/produtos/:id", optionalAuth, async (request, env) => {
  try {
    const { id } = request.params;
    const errors = validateUrlParams({ id }, {
      id: [validators.required, (v, f2) => validators.number(v, f2, { min: 1 })]
    });
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        error: "ID inv\xE1lido",
        details: errors
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const produto = await env.DB.prepare("SELECT id FROM produtos WHERE id = ?").bind(id).first();
    if (!produto) {
      return new Response(JSON.stringify({
        error: "Produto n\xE3o encontrado"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const result = await env.DB.prepare(`
      UPDATE produtos 
      SET ativo = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();
    if (result.success) {
      await invalidateCachePattern(env.DB, "GET|/api/v1/produtos%");
      return new Response(JSON.stringify({
        success: true,
        message: "Produto removido com sucesso"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    throw new Error("Falha ao remover produto");
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro ao remover produto",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
});
var produtos_default = router;

// src/routes/sabores.js
var router2 = t();
var saborSchema = {
  nome: { required: true, type: "string", maxLength: 100 },
  precoAdicional: { required: true, type: "number", min: 0 },
  descricao: { type: "string", maxLength: 500 },
  ativo: { type: "boolean", default: true },
  categoria: { type: "string", maxLength: 50 }
};
router2.get("/api/v1/sabores", optionalAuth, async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 20;
    const categoria = url.searchParams.get("categoria");
    const ativo = url.searchParams.get("ativo");
    const search = url.searchParams.get("search");
    const deviceType = request.headers.get("X-Device-Type") || "desktop";
    const optimizedLimit = optimizeForMobile(limit, deviceType);
    const offset = (page - 1) * optimizedLimit;
    let query = "SELECT * FROM sabores WHERE 1=1";
    const params = [];
    if (categoria) {
      query += " AND categoria = ?";
      params.push(categoria);
    }
    if (ativo !== null && ativo !== void 0) {
      query += " AND ativo = ?";
      params.push(ativo === "true" ? 1 : 0);
    }
    if (search) {
      query += " AND (nome LIKE ? OR descricao LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    query += " ORDER BY nome ASC LIMIT ? OFFSET ?";
    params.push(optimizedLimit, offset);
    const { results: sabores } = await env.DB.prepare(query).bind(...params).all();
    let countQuery = "SELECT COUNT(*) as total FROM sabores WHERE 1=1";
    const countParams = [];
    if (categoria) {
      countQuery += " AND categoria = ?";
      countParams.push(categoria);
    }
    if (ativo !== null && ativo !== void 0) {
      countQuery += " AND ativo = ?";
      countParams.push(ativo === "true" ? 1 : 0);
    }
    if (search) {
      countQuery += " AND (nome LIKE ? OR descricao LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const { results: [{ total }] } = await env.DB.prepare(countQuery).bind(...countParams).all();
    const pagination = createMobilePagination(page, optimizedLimit, total, deviceType);
    const adaptedSabores = adaptResponseForDevice(sabores, deviceType, {
      removeFields: deviceType === "mobile" ? ["created_at", "updated_at"] : [],
      optimizeNumbers: true
    });
    const response = {
      success: true,
      data: adaptedSabores,
      pagination,
      filters: {
        categoria,
        ativo: ativo ? ativo === "true" : null,
        search
      },
      meta: {
        total,
        device_optimized: true,
        cache_strategy: deviceType === "mobile" ? "aggressive" : "moderate"
      }
    };
    const finalResponse = await compressResponse(response, request);
    return addCORSHeaders(new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": deviceType === "mobile" ? "public, max-age=1800" : "public, max-age=600",
        "X-Device-Optimized": "true"
      }
    }));
  } catch (error) {
    console.error("Erro ao listar sabores:", error);
    return addCORSHeaders(new Response(JSON.stringify({
      success: false,
      error: "Erro interno do servidor",
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
});
router2.get(
  "/api/v1/sabores/:id",
  validateUrlParams({ id: { required: true, type: "string" } }),
  optionalAuth,
  withCache(300),
  // Cache por 5 minutos
  async (request, env) => {
    try {
      const { id } = request.params;
      const deviceType = request.headers.get("X-Device-Type") || "desktop";
      const { results } = await env.DB.prepare(
        "SELECT * FROM sabores WHERE id = ?"
      ).bind(id).all();
      if (results.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Sabor n\xE3o encontrado",
          code: "NOT_FOUND"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const sabor = results[0];
      const adaptedSabor = adaptResponseForDevice(sabor, deviceType, {
        removeFields: deviceType === "mobile" ? ["created_at", "updated_at"] : [],
        optimizeNumbers: true
      });
      const response = {
        success: true,
        data: adaptedSabor,
        meta: {
          device_optimized: true,
          cached: true
        }
      };
      const finalResponse = await compressResponse(response, request);
      return addCORSHeaders(new Response(JSON.stringify(finalResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
          "X-Device-Optimized": "true"
        }
      }));
    } catch (error) {
      console.error("Erro ao buscar sabor:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router2.post(
  "/api/v1/sabores",
  authenticateRequest2,
  validateRequest(saborSchema),
  async (request, env) => {
    try {
      const data = request.validatedData;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { results } = await env.DB.prepare(`
        INSERT INTO sabores (nome, preco_adicional, descricao, ativo, categoria, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(
        data.nome,
        data.precoAdicional,
        data.descricao || null,
        data.ativo !== false ? 1 : 0,
        data.categoria || null,
        now,
        now
      ).all();
      const novoSabor = results[0];
      await invalidateCache(env, "sabores:*");
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "sabores",
        novoSabor.id,
        "create",
        JSON.stringify(novoSabor),
        now
      ).run();
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: novoSabor,
        message: "Sabor criado com sucesso"
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("Erro ao criar sabor:", error);
      if (error.message.includes("UNIQUE constraint failed")) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "J\xE1 existe um sabor com este nome",
          code: "DUPLICATE_NAME"
        }), {
          status: 409,
          headers: { "Content-Type": "application/json" }
        }));
      }
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router2.put(
  "/api/v1/sabores/:id",
  validateUrlParams({ id: { required: true, type: "string" } }),
  authenticateRequest2,
  validateRequest(saborSchema, false),
  // Validação parcial para updates
  async (request, env) => {
    try {
      const { id } = request.params;
      const data = request.validatedData;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { results: existing } = await env.DB.prepare(
        "SELECT * FROM sabores WHERE id = ?"
      ).bind(id).all();
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Sabor n\xE3o encontrado",
          code: "NOT_FOUND"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const updateFields = [];
      const updateValues = [];
      if (data.nome !== void 0) {
        updateFields.push("nome = ?");
        updateValues.push(data.nome);
      }
      if (data.precoAdicional !== void 0) {
        updateFields.push("preco_adicional = ?");
        updateValues.push(data.precoAdicional);
      }
      if (data.descricao !== void 0) {
        updateFields.push("descricao = ?");
        updateValues.push(data.descricao);
      }
      if (data.ativo !== void 0) {
        updateFields.push("ativo = ?");
        updateValues.push(data.ativo ? 1 : 0);
      }
      if (data.categoria !== void 0) {
        updateFields.push("categoria = ?");
        updateValues.push(data.categoria);
      }
      updateFields.push("updated_at = ?");
      updateValues.push(now);
      updateValues.push(id);
      const { results } = await env.DB.prepare(`
        UPDATE sabores SET ${updateFields.join(", ")} WHERE id = ?
        RETURNING *
      `).bind(...updateValues).all();
      const saborAtualizado = results[0];
      await invalidateCache(env, "sabores:*");
      await invalidateCache(env, `sabor:${id}`);
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "sabores",
        id,
        "update",
        JSON.stringify(saborAtualizado),
        now
      ).run();
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: saborAtualizado,
        message: "Sabor atualizado com sucesso"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("Erro ao atualizar sabor:", error);
      if (error.message.includes("UNIQUE constraint failed")) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "J\xE1 existe um sabor com este nome",
          code: "DUPLICATE_NAME"
        }), {
          status: 409,
          headers: { "Content-Type": "application/json" }
        }));
      }
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router2.delete(
  "/api/v1/sabores/:id",
  validateUrlParams({ id: { required: true, type: "string" } }),
  authenticateRequest2,
  async (request, env) => {
    try {
      const { id } = request.params;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { results: existing } = await env.DB.prepare(
        "SELECT * FROM sabores WHERE id = ?"
      ).bind(id).all();
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Sabor n\xE3o encontrado",
          code: "NOT_FOUND"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const { results: pedidosUsando } = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM item_sabores 
        WHERE sabor_id = ?
      `).bind(id).all();
      if (pedidosUsando[0].count > 0) {
        await env.DB.prepare(`
          UPDATE sabores SET ativo = 0, updated_at = ? WHERE id = ?
        `).bind(now, id).run();
        return addCORSHeaders(new Response(JSON.stringify({
          success: true,
          message: "Sabor desativado com sucesso (estava sendo usado em pedidos)",
          action: "deactivated"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      } else {
        await env.DB.prepare("DELETE FROM sabores WHERE id = ?").bind(id).run();
        await invalidateCache(env, "sabores:*");
        await invalidateCache(env, `sabor:${id}`);
        await env.DB.prepare(`
          INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          "sabores",
          id,
          "delete",
          JSON.stringify({ id }),
          now
        ).run();
        return addCORSHeaders(new Response(JSON.stringify({
          success: true,
          message: "Sabor removido com sucesso",
          action: "deleted"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }
    } catch (error) {
      console.error("Erro ao remover sabor:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router2.get(
  "/api/v1/sabores/categorias",
  optionalAuth,
  withCache(1800),
  // Cache por 30 minutos
  async (request, env) => {
    try {
      const { results } = await env.DB.prepare(`
        SELECT DISTINCT categoria 
        FROM sabores 
        WHERE categoria IS NOT NULL AND categoria != '' AND ativo = 1
        ORDER BY categoria ASC
      `).all();
      const categorias = results.map((row) => row.categoria);
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: categorias,
        meta: {
          total: categorias.length,
          cached: true
        }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=1800"
        }
      }));
    } catch (error) {
      console.error("Erro ao listar categorias:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
var sabores_default = router2;

// src/routes/tamanhos.js
var router3 = t();
var tamanhoSchema = {
  nome: { required: true, type: "string", maxLength: 50 },
  multiplicador: { required: true, type: "number", min: 0.1, max: 10 },
  descricao: { type: "string", maxLength: 200 },
  ativo: { type: "boolean", default: true },
  ordem: { type: "number", min: 0, default: 0 }
};
router3.get("/api/v1/tamanhos", optionalAuth, async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 20;
    const ativo = url.searchParams.get("ativo");
    const search = url.searchParams.get("search");
    const deviceType = request.headers.get("X-Device-Type") || "desktop";
    const optimizedLimit = optimizeForMobile(limit, deviceType);
    const offset = (page - 1) * optimizedLimit;
    let query = "SELECT * FROM tamanhos WHERE 1=1";
    const params = [];
    if (ativo !== null && ativo !== void 0) {
      query += " AND ativo = ?";
      params.push(ativo === "true" ? 1 : 0);
    }
    if (search) {
      query += " AND (nome LIKE ? OR descricao LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    query += " ORDER BY ordem ASC, nome ASC LIMIT ? OFFSET ?";
    params.push(optimizedLimit, offset);
    const { results: tamanhos } = await env.DB.prepare(query).bind(...params).all();
    let countQuery = "SELECT COUNT(*) as total FROM tamanhos WHERE 1=1";
    const countParams = [];
    if (ativo !== null && ativo !== void 0) {
      countQuery += " AND ativo = ?";
      countParams.push(ativo === "true" ? 1 : 0);
    }
    if (search) {
      countQuery += " AND (nome LIKE ? OR descricao LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const { results: [{ total }] } = await env.DB.prepare(countQuery).bind(...countParams).all();
    const pagination = createMobilePagination(page, optimizedLimit, total, deviceType);
    const adaptedTamanhos = adaptResponseForDevice(tamanhos, deviceType, {
      removeFields: deviceType === "mobile" ? ["created_at", "updated_at"] : [],
      optimizeNumbers: true
    });
    const response = {
      success: true,
      data: adaptedTamanhos,
      pagination,
      filters: {
        ativo: ativo ? ativo === "true" : null,
        search
      },
      meta: {
        total,
        device_optimized: true,
        cache_strategy: deviceType === "mobile" ? "aggressive" : "moderate"
      }
    };
    const finalResponse = await compressResponse(response, request);
    return addCORSHeaders(new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": deviceType === "mobile" ? "public, max-age=1800" : "public, max-age=600",
        "X-Device-Optimized": "true"
      }
    }));
  } catch (error) {
    console.error("Erro ao listar tamanhos:", error);
    return addCORSHeaders(new Response(JSON.stringify({
      success: false,
      error: "Erro interno do servidor",
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
});
router3.get(
  "/api/v1/tamanhos/:id",
  validateUrlParams({ id: { required: true, type: "string" } }),
  optionalAuth,
  withCache(300),
  // Cache por 5 minutos
  async (request, env) => {
    try {
      const { id } = request.params;
      const deviceType = request.headers.get("X-Device-Type") || "desktop";
      const { results } = await env.DB.prepare(
        "SELECT * FROM tamanhos WHERE id = ?"
      ).bind(id).all();
      if (results.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Tamanho n\xE3o encontrado",
          code: "NOT_FOUND"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const tamanho = results[0];
      const adaptedTamanho = adaptResponseForDevice(tamanho, deviceType, {
        removeFields: deviceType === "mobile" ? ["created_at", "updated_at"] : [],
        optimizeNumbers: true
      });
      const response = {
        success: true,
        data: adaptedTamanho,
        meta: {
          device_optimized: true,
          cached: true
        }
      };
      const finalResponse = await compressResponse(response, request);
      return addCORSHeaders(new Response(JSON.stringify(finalResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
          "X-Device-Optimized": "true"
        }
      }));
    } catch (error) {
      console.error("Erro ao buscar tamanho:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router3.post(
  "/api/v1/tamanhos",
  authenticateRequest2,
  validateRequest(tamanhoSchema),
  async (request, env) => {
    try {
      const data = request.validatedData;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { results } = await env.DB.prepare(`
        INSERT INTO tamanhos (nome, multiplicador, descricao, ativo, ordem, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(
        data.nome,
        data.multiplicador,
        data.descricao || null,
        data.ativo !== false ? 1 : 0,
        data.ordem || 0,
        now,
        now
      ).all();
      const novoTamanho = results[0];
      await invalidateCache(env, "tamanhos:*");
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "tamanhos",
        novoTamanho.id,
        "create",
        JSON.stringify(novoTamanho),
        now
      ).run();
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: novoTamanho,
        message: "Tamanho criado com sucesso"
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("Erro ao criar tamanho:", error);
      if (error.message.includes("UNIQUE constraint failed")) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "J\xE1 existe um tamanho com este nome",
          code: "DUPLICATE_NAME"
        }), {
          status: 409,
          headers: { "Content-Type": "application/json" }
        }));
      }
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router3.put(
  "/api/v1/tamanhos/:id",
  validateUrlParams({ id: { required: true, type: "string" } }),
  authenticateRequest2,
  validateRequest(tamanhoSchema, false),
  // Validação parcial para updates
  async (request, env) => {
    try {
      const { id } = request.params;
      const data = request.validatedData;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { results: existing } = await env.DB.prepare(
        "SELECT * FROM tamanhos WHERE id = ?"
      ).bind(id).all();
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Tamanho n\xE3o encontrado",
          code: "NOT_FOUND"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const updateFields = [];
      const updateValues = [];
      if (data.nome !== void 0) {
        updateFields.push("nome = ?");
        updateValues.push(data.nome);
      }
      if (data.multiplicador !== void 0) {
        updateFields.push("multiplicador = ?");
        updateValues.push(data.multiplicador);
      }
      if (data.descricao !== void 0) {
        updateFields.push("descricao = ?");
        updateValues.push(data.descricao);
      }
      if (data.ativo !== void 0) {
        updateFields.push("ativo = ?");
        updateValues.push(data.ativo ? 1 : 0);
      }
      if (data.ordem !== void 0) {
        updateFields.push("ordem = ?");
        updateValues.push(data.ordem);
      }
      updateFields.push("updated_at = ?");
      updateValues.push(now);
      updateValues.push(id);
      const { results } = await env.DB.prepare(`
        UPDATE tamanhos SET ${updateFields.join(", ")} WHERE id = ?
        RETURNING *
      `).bind(...updateValues).all();
      const tamanhoAtualizado = results[0];
      await invalidateCache(env, "tamanhos:*");
      await invalidateCache(env, `tamanho:${id}`);
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "tamanhos",
        id,
        "update",
        JSON.stringify(tamanhoAtualizado),
        now
      ).run();
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: tamanhoAtualizado,
        message: "Tamanho atualizado com sucesso"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("Erro ao atualizar tamanho:", error);
      if (error.message.includes("UNIQUE constraint failed")) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "J\xE1 existe um tamanho com este nome",
          code: "DUPLICATE_NAME"
        }), {
          status: 409,
          headers: { "Content-Type": "application/json" }
        }));
      }
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router3.delete(
  "/api/v1/tamanhos/:id",
  validateUrlParams({ id: { required: true, type: "string" } }),
  authenticateRequest2,
  async (request, env) => {
    try {
      const { id } = request.params;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { results: existing } = await env.DB.prepare(
        "SELECT * FROM tamanhos WHERE id = ?"
      ).bind(id).all();
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Tamanho n\xE3o encontrado",
          code: "NOT_FOUND"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const { results: pedidosUsando } = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM pedido_itens 
        WHERE produto_id IN (
          SELECT id FROM produtos WHERE 1=1
        )
      `).bind().all();
      await env.DB.prepare(`
        UPDATE tamanhos SET ativo = 0, updated_at = ? WHERE id = ?
      `).bind(now, id).run();
      await invalidateCache(env, "tamanhos:*");
      await invalidateCache(env, `tamanho:${id}`);
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "tamanhos",
        id,
        "update",
        JSON.stringify({ id, ativo: false }),
        now
      ).run();
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        message: "Tamanho desativado com sucesso",
        action: "deactivated"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("Erro ao remover tamanho:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router3.post(
  "/api/v1/tamanhos/reorder",
  authenticateRequest2,
  validateRequest({
    tamanhos: {
      required: true,
      type: "array",
      items: {
        id: { required: true, type: "string" },
        ordem: { required: true, type: "number", min: 0 }
      }
    }
  }),
  async (request, env) => {
    try {
      const { tamanhos } = request.validatedData;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      for (const tamanho of tamanhos) {
        await env.DB.prepare(`
          UPDATE tamanhos SET ordem = ?, updated_at = ? WHERE id = ?
        `).bind(tamanho.ordem, now, tamanho.id).run();
      }
      await invalidateCache(env, "tamanhos:*");
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "tamanhos",
        "bulk_reorder",
        "update",
        JSON.stringify({ tamanhos }),
        now
      ).run();
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        message: "Ordem dos tamanhos atualizada com sucesso",
        data: { updated_count: tamanhos.length }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("Erro ao reordenar tamanhos:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router3.post(
  "/api/v1/tamanhos/calcular-preco",
  optionalAuth,
  validateRequest({
    preco_base: { required: true, type: "number", min: 0 },
    tamanho_id: { required: true, type: "string" }
  }),
  async (request, env) => {
    try {
      const { preco_base, tamanho_id } = request.validatedData;
      const { results } = await env.DB.prepare(
        "SELECT multiplicador FROM tamanhos WHERE id = ? AND ativo = 1"
      ).bind(tamanho_id).all();
      if (results.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Tamanho n\xE3o encontrado ou inativo",
          code: "NOT_FOUND"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const { multiplicador } = results[0];
      const preco_final = preco_base * multiplicador;
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: {
          preco_base,
          multiplicador,
          preco_final: Math.round(preco_final * 100) / 100,
          // Arredondar para 2 casas decimais
          economia: preco_base - preco_final
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("Erro ao calcular pre\xE7o:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
var tamanhos_default = router3;

// src/routes/pedidos.js
var router4 = t();
var pedidoSchema = {
  cliente_nome: { required: true, type: "string", maxLength: 100 },
  cliente_telefone: { required: true, type: "string", maxLength: 20 },
  cliente_endereco: { type: "string", maxLength: 500 },
  tipo_entrega: { required: true, type: "enum", values: ["balcao", "entrega"] },
  forma_pagamento: { required: true, type: "enum", values: ["dinheiro", "cartao", "pix"] },
  observacoes: { type: "string", maxLength: 1e3 },
  itens: {
    required: true,
    type: "array",
    minItems: 1,
    items: {
      produto_id: { required: true, type: "string" },
      quantidade: { required: true, type: "number", min: 1 },
      preco_unitario: { required: true, type: "number", min: 0 },
      observacoes: { type: "string", maxLength: 200 },
      sabores: {
        type: "array",
        items: {
          sabor_id: { required: true, type: "string" },
          preco_adicional: { type: "number", min: 0, default: 0 }
        }
      }
    }
  }
};
router4.get("/api/v1/pedidos", optionalAuth, async (request, env) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 20;
    const status = url.searchParams.get("status");
    const tipo_entrega = url.searchParams.get("tipo_entrega");
    const forma_pagamento = url.searchParams.get("forma_pagamento");
    const data_inicio = url.searchParams.get("data_inicio");
    const data_fim = url.searchParams.get("data_fim");
    const search = url.searchParams.get("search");
    const deviceType = request.headers.get("X-Device-Type") || "desktop";
    const optimizedLimit = optimizeForMobile(limit, deviceType);
    const offset = (page - 1) * optimizedLimit;
    let query = `
      SELECT p.*, 
             COUNT(pi.id) as total_itens,
             SUM(pi.quantidade * pi.preco_unitario) as valor_itens
      FROM pedidos p
      LEFT JOIN pedido_itens pi ON p.id = pi.pedido_id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    }
    if (tipo_entrega) {
      query += " AND p.tipo_entrega = ?";
      params.push(tipo_entrega);
    }
    if (forma_pagamento) {
      query += " AND p.forma_pagamento = ?";
      params.push(forma_pagamento);
    }
    if (data_inicio) {
      query += " AND DATE(p.created_at) >= ?";
      params.push(data_inicio);
    }
    if (data_fim) {
      query += " AND DATE(p.created_at) <= ?";
      params.push(data_fim);
    }
    if (search) {
      query += " AND (p.cliente_nome LIKE ? OR p.cliente_telefone LIKE ? OR p.id LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += " GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
    params.push(optimizedLimit, offset);
    const { results: pedidos } = await env.DB.prepare(query).bind(...params).all();
    let countQuery = "SELECT COUNT(DISTINCT p.id) as total FROM pedidos p WHERE 1=1";
    const countParams = [];
    if (status) {
      countQuery += " AND p.status = ?";
      countParams.push(status);
    }
    if (tipo_entrega) {
      countQuery += " AND p.tipo_entrega = ?";
      countParams.push(tipo_entrega);
    }
    if (forma_pagamento) {
      countQuery += " AND p.forma_pagamento = ?";
      countParams.push(forma_pagamento);
    }
    if (data_inicio) {
      countQuery += " AND DATE(p.created_at) >= ?";
      countParams.push(data_inicio);
    }
    if (data_fim) {
      countQuery += " AND DATE(p.created_at) <= ?";
      countParams.push(data_fim);
    }
    if (search) {
      countQuery += " AND (p.cliente_nome LIKE ? OR p.cliente_telefone LIKE ? OR p.id LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const { results: [{ total }] } = await env.DB.prepare(countQuery).bind(...countParams).all();
    const pagination = createMobilePagination(page, optimizedLimit, total, deviceType);
    const adaptedPedidos = adaptResponseForDevice(pedidos, deviceType, {
      removeFields: deviceType === "mobile" ? ["updated_at"] : [],
      optimizeNumbers: true
    });
    const response = {
      success: true,
      data: adaptedPedidos,
      pagination,
      filters: {
        status,
        tipo_entrega,
        forma_pagamento,
        data_inicio,
        data_fim,
        search
      },
      meta: {
        total,
        device_optimized: true,
        cache_strategy: deviceType === "mobile" ? "moderate" : "light"
      }
    };
    const finalResponse = await compressResponse(response, request);
    return addCORSHeaders(new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": deviceType === "mobile" ? "public, max-age=300" : "public, max-age=120",
        "X-Device-Optimized": "true"
      }
    }));
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    return addCORSHeaders(new Response(JSON.stringify({
      success: false,
      error: "Erro interno do servidor",
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
});
router4.get(
  "/api/v1/pedidos/:id",
  validateUrlParams({ id: { required: true, type: "string" } }),
  optionalAuth,
  withCache(180),
  // Cache por 3 minutos
  async (request, env) => {
    try {
      const { id } = request.params;
      const deviceType = request.headers.get("X-Device-Type") || "desktop";
      const { results: pedidoResults } = await env.DB.prepare(
        "SELECT * FROM pedidos WHERE id = ?"
      ).bind(id).all();
      if (pedidoResults.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Pedido n\xE3o encontrado",
          code: "NOT_FOUND"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const pedido = pedidoResults[0];
      const { results: itens } = await env.DB.prepare(`
        SELECT 
          pi.*,
          p.nome as produto_nome,
          p.categoria as produto_categoria,
          p.imagem as produto_imagem
        FROM pedido_itens pi
        JOIN produtos p ON pi.produto_id = p.id
        WHERE pi.pedido_id = ?
        ORDER BY pi.created_at ASC
      `).bind(id).all();
      for (let item of itens) {
        const { results: sabores } = await env.DB.prepare(`
          SELECT 
            isab.*,
            s.nome as sabor_nome,
            s.categoria as sabor_categoria
          FROM item_sabores isab
          JOIN sabores s ON isab.sabor_id = s.id
          WHERE isab.item_id = ?
          ORDER BY s.nome ASC
        `).bind(item.id).all();
        item.sabores = sabores;
      }
      pedido.itens = itens;
      const adaptedPedido = adaptResponseForDevice(pedido, deviceType, {
        removeFields: deviceType === "mobile" ? ["updated_at"] : [],
        optimizeNumbers: true
      });
      const response = {
        success: true,
        data: adaptedPedido,
        meta: {
          device_optimized: true,
          cached: true,
          total_itens: itens.length
        }
      };
      const finalResponse = await compressResponse(response, request);
      return addCORSHeaders(new Response(JSON.stringify(finalResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=180",
          "X-Device-Optimized": "true"
        }
      }));
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router4.post(
  "/api/v1/pedidos",
  authenticateRequest2,
  validateRequest(pedidoSchema),
  async (request, env) => {
    try {
      const data = request.validatedData;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      let total_pedido = 0;
      for (const item of data.itens) {
        let total_item = item.quantidade * item.preco_unitario;
        if (item.sabores) {
          for (const sabor of item.sabores) {
            total_item += sabor.preco_adicional || 0;
          }
        }
        total_pedido += total_item;
      }
      const { results: pedidoResults } = await env.DB.prepare(`
        INSERT INTO pedidos (
          cliente_nome, cliente_telefone, cliente_endereco,
          tipo_entrega, forma_pagamento, observacoes,
          total, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(
        data.cliente_nome,
        data.cliente_telefone,
        data.cliente_endereco || null,
        data.tipo_entrega,
        data.forma_pagamento,
        data.observacoes || null,
        total_pedido,
        "pendente",
        now,
        now
      ).all();
      const novoPedido = pedidoResults[0];
      const itensCompletos = [];
      for (const item of data.itens) {
        const { results: itemResults } = await env.DB.prepare(`
          INSERT INTO pedido_itens (
            pedido_id, produto_id, quantidade, preco_unitario, observacoes, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
          RETURNING *
        `).bind(
          novoPedido.id,
          item.produto_id,
          item.quantidade,
          item.preco_unitario,
          item.observacoes || null,
          now
        ).all();
        const novoItem = itemResults[0];
        if (item.sabores && item.sabores.length > 0) {
          const saboresCompletos = [];
          for (const sabor of item.sabores) {
            await env.DB.prepare(`
              INSERT INTO item_sabores (item_id, sabor_id, preco_adicional, created_at)
              VALUES (?, ?, ?, ?)
            `).bind(
              novoItem.id,
              sabor.sabor_id,
              sabor.preco_adicional || 0,
              now
            ).run();
            saboresCompletos.push({
              sabor_id: sabor.sabor_id,
              preco_adicional: sabor.preco_adicional || 0
            });
          }
          novoItem.sabores = saboresCompletos;
        }
        itensCompletos.push(novoItem);
      }
      novoPedido.itens = itensCompletos;
      await invalidateCache(env, "pedidos:*");
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "pedidos",
        novoPedido.id,
        "create",
        JSON.stringify(novoPedido),
        now
      ).run();
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: novoPedido,
        message: "Pedido criado com sucesso"
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router4.put(
  "/api/v1/pedidos/:id/status",
  validateUrlParams({ id: { required: true, type: "string" } }),
  authenticateRequest2,
  validateRequest({
    status: {
      required: true,
      type: "enum",
      values: ["pendente", "preparando", "pronto", "entregue", "cancelado"]
    }
  }),
  async (request, env) => {
    try {
      const { id } = request.params;
      const { status } = request.validatedData;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { results: existing } = await env.DB.prepare(
        "SELECT * FROM pedidos WHERE id = ?"
      ).bind(id).all();
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Pedido n\xE3o encontrado",
          code: "NOT_FOUND"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const { results } = await env.DB.prepare(`
        UPDATE pedidos SET status = ?, updated_at = ? WHERE id = ?
        RETURNING *
      `).bind(status, now, id).all();
      const pedidoAtualizado = results[0];
      await invalidateCache(env, "pedidos:*");
      await invalidateCache(env, `pedido:${id}`);
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "pedidos",
        id,
        "update",
        JSON.stringify({ id, status, updated_at: now }),
        now
      ).run();
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: pedidoAtualizado,
        message: `Status do pedido atualizado para: ${status}`
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router4.delete(
  "/api/v1/pedidos/:id",
  validateUrlParams({ id: { required: true, type: "string" } }),
  authenticateRequest2,
  async (request, env) => {
    try {
      const { id } = request.params;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { results: existing } = await env.DB.prepare(
        "SELECT * FROM pedidos WHERE id = ?"
      ).bind(id).all();
      if (existing.length === 0) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Pedido n\xE3o encontrado",
          code: "NOT_FOUND"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const pedido = existing[0];
      if (["entregue", "cancelado"].includes(pedido.status)) {
        return addCORSHeaders(new Response(JSON.stringify({
          success: false,
          error: "Pedido n\xE3o pode ser cancelado",
          code: "CANNOT_CANCEL",
          current_status: pedido.status
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }));
      }
      const { results } = await env.DB.prepare(`
        UPDATE pedidos SET status = 'cancelado', updated_at = ? WHERE id = ?
        RETURNING *
      `).bind(now, id).all();
      const pedidoCancelado = results[0];
      await invalidateCache(env, "pedidos:*");
      await invalidateCache(env, `pedido:${id}`);
      await env.DB.prepare(`
        INSERT INTO sync_queue (table_name, record_id, operation, data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "pedidos",
        id,
        "update",
        JSON.stringify({ id, status: "cancelado", updated_at: now }),
        now
      ).run();
      return addCORSHeaders(new Response(JSON.stringify({
        success: true,
        data: pedidoCancelado,
        message: "Pedido cancelado com sucesso"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
router4.get(
  "/api/v1/pedidos/stats",
  authenticateRequest2,
  withCache(300),
  // Cache por 5 minutos
  async (request, env) => {
    try {
      const url = new URL(request.url);
      const periodo = url.searchParams.get("periodo") || "hoje";
      let dataInicio;
      const agora = /* @__PURE__ */ new Date();
      switch (periodo) {
        case "hoje":
          dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
          break;
        case "semana":
          dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1e3);
          break;
        case "mes":
          dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
          break;
        case "ano":
          dataInicio = new Date(agora.getFullYear(), 0, 1);
          break;
        default:
          dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      }
      const { results: stats } = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_pedidos,
          SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
          SUM(CASE WHEN status = 'preparando' THEN 1 ELSE 0 END) as preparando,
          SUM(CASE WHEN status = 'pronto' THEN 1 ELSE 0 END) as prontos,
          SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) as entregues,
          SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
          SUM(total) as faturamento_total,
          AVG(total) as ticket_medio
        FROM pedidos 
        WHERE created_at >= ?
      `).bind(dataInicio.toISOString()).all();
      const { results: pagamentos } = await env.DB.prepare(`
        SELECT 
          forma_pagamento,
          COUNT(*) as quantidade,
          SUM(total) as valor_total
        FROM pedidos 
        WHERE created_at >= ?
        GROUP BY forma_pagamento
      `).bind(dataInicio.toISOString()).all();
      const { results: entregas } = await env.DB.prepare(`
        SELECT 
          tipo_entrega,
          COUNT(*) as quantidade,
          SUM(total) as valor_total
        FROM pedidos 
        WHERE created_at >= ?
        GROUP BY tipo_entrega
      `).bind(dataInicio.toISOString()).all();
      const response = {
        success: true,
        data: {
          periodo,
          data_inicio: dataInicio.toISOString(),
          resumo: stats[0],
          por_pagamento: pagamentos,
          por_entrega: entregas
        },
        meta: {
          cached: true,
          generated_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      return addCORSHeaders(new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300"
        }
      }));
    } catch (error) {
      console.error("Erro ao buscar estat\xEDsticas:", error);
      return addCORSHeaders(new Response(JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }
);
var pedidos_default = router4;

// src/routes/sync.js
var router5 = t();
router5.post("/api/v1/sync/upload", optionalAuth, async (request, env) => {
  try {
    const { operations } = await request.json();
    if (!Array.isArray(operations)) {
      return new Response(JSON.stringify({
        error: "Operations deve ser um array",
        code: "INVALID_OPERATIONS"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const results = [];
    const errors = [];
    for (const operation of operations) {
      try {
        const result = await processOperation(env.DB, operation);
        results.push({
          id: operation.id,
          status: "success",
          result
        });
      } catch (error) {
        errors.push({
          id: operation.id,
          status: "error",
          error: error.message
        });
      }
    }
    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errorDetails: errors
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro na sincroniza\xE7\xE3o",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
});
router5.get("/api/v1/sync/download", optionalAuth, async (request, env) => {
  try {
    const url = new URL(request.url);
    const lastSync = url.searchParams.get("last_sync");
    const tables = url.searchParams.get("tables")?.split(",") || ["produtos", "sabores", "tamanhos"];
    const syncData = {};
    const currentTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    for (const table of tables) {
      let query = `SELECT * FROM ${table}`;
      let params = [];
      if (lastSync) {
        query += ` WHERE updated_at > ?`;
        params.push(lastSync);
      }
      query += ` ORDER BY updated_at DESC LIMIT 1000`;
      const stmt = env.DB.prepare(query);
      if (params.length > 0) {
        stmt.bind(...params);
      }
      const results = await stmt.all();
      syncData[table] = results.results || [];
    }
    const deletedData = {};
    return new Response(JSON.stringify({
      success: true,
      timestamp: currentTimestamp,
      data: syncData,
      deleted: deletedData,
      has_more: false
      // Implementar paginação se necessário
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        ...corsHeaders2
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro no download de sincroniza\xE7\xE3o",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
});
router5.get("/api/v1/sync/status", async (request, env) => {
  try {
    const stats = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) as total FROM produtos WHERE ativo = 1").first(),
      env.DB.prepare("SELECT COUNT(*) as total FROM sabores WHERE ativo = 1").first(),
      env.DB.prepare("SELECT COUNT(*) as total FROM tamanhos WHERE ativo = 1").first(),
      env.DB.prepare('SELECT COUNT(*) as total FROM pedidos WHERE DATE(created_at) = DATE("now")').first(),
      env.DB.prepare("SELECT MAX(updated_at) as last_update FROM produtos").first()
    ]);
    return new Response(JSON.stringify({
      success: true,
      stats: {
        produtos_ativos: stats[0].total,
        sabores_ativos: stats[1].total,
        tamanhos_ativos: stats[2].total,
        pedidos_hoje: stats[3].total,
        last_update: stats[4].last_update
      },
      server_time: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60",
        // Cache por 1 minuto
        ...corsHeaders2
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro ao verificar status",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
});
router5.post("/api/v1/sync/resolve-conflict", optionalAuth, async (request, env) => {
  try {
    const { table, id, resolution, data } = await request.json();
    if (!table || !id || !resolution) {
      return new Response(JSON.stringify({
        error: "Par\xE2metros obrigat\xF3rios: table, id, resolution",
        code: "MISSING_PARAMS"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    let result;
    switch (resolution) {
      case "server_wins":
        result = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
        break;
      case "client_wins":
        result = await updateRecord(env.DB, table, id, data);
        break;
      case "merge":
        result = await mergeRecord(env.DB, table, id, data);
        break;
      default:
        throw new Error("Resolu\xE7\xE3o de conflito inv\xE1lida");
    }
    return new Response(JSON.stringify({
      success: true,
      resolution,
      data: result
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro na resolu\xE7\xE3o de conflito",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
});
async function processOperation(db, operation) {
  const { type, table, data, id } = operation;
  switch (type) {
    case "CREATE":
      return await createRecord(db, table, data);
    case "UPDATE":
      return await updateRecord(db, table, id, data);
    case "DELETE":
      return await deleteRecord(db, table, id);
    default:
      throw new Error(`Tipo de opera\xE7\xE3o inv\xE1lido: ${type}`);
  }
}
__name(processOperation, "processOperation");
async function createRecord(db, table, data) {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map(() => "?").join(", ");
  const query = `
    INSERT INTO ${table} (${fields.join(", ")})
    VALUES (${placeholders})
  `;
  const result = await db.prepare(query).bind(...values).run();
  if (result.success) {
    return await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(result.meta.last_row_id).first();
  }
  throw new Error("Falha ao criar registro");
}
__name(createRecord, "createRecord");
async function updateRecord(db, table, id, data) {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const query = `
    UPDATE ${table} 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const result = await db.prepare(query).bind(...values, id).run();
  if (result.success && result.changes > 0) {
    return await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  }
  throw new Error("Registro n\xE3o encontrado ou n\xE3o atualizado");
}
__name(updateRecord, "updateRecord");
async function deleteRecord(db, table, id) {
  const result = await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  if (result.success && result.changes > 0) {
    return { deleted: true, id };
  }
  throw new Error("Registro n\xE3o encontrado ou n\xE3o removido");
}
__name(deleteRecord, "deleteRecord");
async function mergeRecord(db, table, id, clientData) {
  const serverData = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  if (!serverData) {
    throw new Error("Registro n\xE3o encontrado no servidor");
  }
  const merged = { ...serverData };
  for (const [key, value] of Object.entries(clientData)) {
    if (key !== "id" && key !== "created_at" && key !== "updated_at") {
      merged[key] = value;
    }
  }
  return await updateRecord(db, table, id, merged);
}
__name(mergeRecord, "mergeRecord");
var sync_default = router5;

// src/index.js
var router6 = t();
router6.all("*", handleCORS);
router6.get("/health", () => {
  return new Response(JSON.stringify({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: "1.0.0"
  }), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
});
router6.all("*", produtos_default.handle);
router6.all("*", sabores_default.handle);
router6.all("*", tamanhos_default.handle);
router6.all("*", pedidos_default.handle);
router6.all("*", sync_default.handle);
router6.post("/api/v1/admin/clear-cache", authenticateRequest, async (request, env) => {
  try {
    await env.DB.prepare("DELETE FROM cache_dados WHERE expires_at < ?").bind((/* @__PURE__ */ new Date()).toISOString()).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Cache limpo com sucesso"
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro ao limpar cache",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
router6.get("/api/v1/stats", async (request, env) => {
  try {
    const cacheKey = "stats_dashboard";
    const cached = await getCachedResponse(env.DB, cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
          "X-Cache": "HIT"
        }
      });
    }
    const [produtos, pedidosHoje, pedidosPendentes] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) as total FROM produtos WHERE ativo = 1").first(),
      env.DB.prepare(`
        SELECT COUNT(*) as total 
        FROM pedidos 
        WHERE DATE(created_at) = DATE('now')
      `).first(),
      env.DB.prepare("SELECT COUNT(*) as total FROM pedidos WHERE status = ?").bind("Pendente").first()
    ]);
    const stats = {
      produtos_ativos: produtos.total,
      pedidos_hoje: pedidosHoje.total,
      pedidos_pendentes: pedidosPendentes.total,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    await cacheResponse(env.DB, cacheKey, JSON.stringify(stats), 300);
    return new Response(JSON.stringify(stats), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
        "X-Cache": "MISS"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Erro ao buscar estat\xEDsticas",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
var src_default = {
  async fetch(request, env, ctx) {
    try {
      const contentLength = request.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({
          error: "Requisi\xE7\xE3o muito grande",
          max_size: "10MB"
        }), {
          status: 413,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const response = await router6.handle(request, env, ctx);
      const secureResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...response.headers,
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        }
      });
      return secureResponse;
    } catch (error) {
      console.error("Erro no worker:", error);
      return new Response(JSON.stringify({
        error: "Erro interno do servidor",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  },
  // Handler para tarefas agendadas (limpeza de cache)
  async scheduled(controller, env, ctx) {
    try {
      await env.DB.prepare("DELETE FROM cache_dados WHERE expires_at < ?").bind((/* @__PURE__ */ new Date()).toISOString()).run();
      console.log("Cache expirado limpo com sucesso");
    } catch (error) {
      console.error("Erro na limpeza de cache:", error);
    }
  }
};

// C:/Users/Ayslan/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/Ayslan/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-m30Ttn/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// C:/Users/Ayslan/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-m30Ttn/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
