// Middleware de validação de dados otimizado para mobile

import { corsHeaders } from '../utils/cors';

/**
 * Validadores básicos
 */
export const validators = {
  required: (value, field) => {
    if (value === undefined || value === null || value === '') {
      return `Campo '${field}' é obrigatório`;
    }
    return null;
  },

  string: (value, field, options = {}) => {
    if (typeof value !== 'string') {
      return `Campo '${field}' deve ser uma string`;
    }
    
    if (options.minLength && value.length < options.minLength) {
      return `Campo '${field}' deve ter pelo menos ${options.minLength} caracteres`;
    }
    
    if (options.maxLength && value.length > options.maxLength) {
      return `Campo '${field}' deve ter no máximo ${options.maxLength} caracteres`;
    }
    
    if (options.pattern && !options.pattern.test(value)) {
      return `Campo '${field}' tem formato inválido`;
    }
    
    return null;
  },

  number: (value, field, options = {}) => {
    const num = Number(value);
    if (isNaN(num)) {
      return `Campo '${field}' deve ser um número`;
    }
    
    if (options.min !== undefined && num < options.min) {
      return `Campo '${field}' deve ser maior ou igual a ${options.min}`;
    }
    
    if (options.max !== undefined && num > options.max) {
      return `Campo '${field}' deve ser menor ou igual a ${options.max}`;
    }
    
    return null;
  },

  boolean: (value, field) => {
    if (typeof value !== 'boolean') {
      return `Campo '${field}' deve ser verdadeiro ou falso`;
    }
    return null;
  },

  email: (value, field) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `Campo '${field}' deve ser um email válido`;
    }
    return null;
  },

  phone: (value, field) => {
    // Regex para telefone brasileiro
    const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
    if (!phoneRegex.test(value)) {
      return `Campo '${field}' deve ser um telefone válido`;
    }
    return null;
  },

  enum: (value, field, options) => {
    if (!options.values.includes(value)) {
      return `Campo '${field}' deve ser um dos valores: ${options.values.join(', ')}`;
    }
    return null;
  },

  array: (value, field, options = {}) => {
    if (!Array.isArray(value)) {
      return `Campo '${field}' deve ser uma lista`;
    }
    
    if (options.minLength && value.length < options.minLength) {
      return `Campo '${field}' deve ter pelo menos ${options.minLength} itens`;
    }
    
    if (options.maxLength && value.length > options.maxLength) {
      return `Campo '${field}' deve ter no máximo ${options.maxLength} itens`;
    }
    
    return null;
  }
};

/**
 * Esquemas de validação para diferentes entidades
 */
export const schemas = {
  produto: {
    nome: [validators.required, (v, f) => validators.string(v, f, { minLength: 2, maxLength: 100 })],
    categoria: [validators.required, (v, f) => validators.enum(v, f, { values: ['Pizza', 'Pastel', 'Bebida', 'Sobremesa'] })],
    preco: [validators.required, (v, f) => validators.number(v, f, { min: 0 })],
    descricao: [(v, f) => v ? validators.string(v, f, { maxLength: 500 }) : null],
    ativo: [(v, f) => v !== undefined ? validators.boolean(v, f) : null],
    imagem: [(v, f) => v ? validators.string(v, f, { maxLength: 255 }) : null]
  },

  sabor: {
    nome: [validators.required, (v, f) => validators.string(v, f, { minLength: 2, maxLength: 100 })],
    preco_adicional: [(v, f) => v !== undefined ? validators.number(v, f, { min: 0 }) : null],
    descricao: [(v, f) => v ? validators.string(v, f, { maxLength: 500 }) : null],
    ativo: [(v, f) => v !== undefined ? validators.boolean(v, f) : null],
    categoria: [(v, f) => v ? validators.enum(v, f, { values: ['Doce', 'Salgado', 'Especial'] }) : null]
  },

  tamanho: {
    nome: [validators.required, (v, f) => validators.string(v, f, { minLength: 1, maxLength: 50 })],
    multiplicador: [validators.required, (v, f) => validators.number(v, f, { min: 0.1, max: 10 })],
    descricao: [(v, f) => v ? validators.string(v, f, { maxLength: 200 }) : null],
    ativo: [(v, f) => v !== undefined ? validators.boolean(v, f) : null],
    ordem: [(v, f) => v !== undefined ? validators.number(v, f, { min: 0 }) : null]
  },

  pedido: {
    cliente_nome: [validators.required, (v, f) => validators.string(v, f, { minLength: 2, maxLength: 100 })],
    cliente_telefone: [validators.required, validators.phone],
    cliente_endereco: [(v, f) => v ? validators.string(v, f, { maxLength: 300 }) : null],
    forma_pagamento: [validators.required, (v, f) => validators.enum(v, f, { values: ['Dinheiro', 'Cartão', 'PIX', 'Débito', 'Crédito'] })],
    tipo_entrega: [validators.required, (v, f) => validators.enum(v, f, { values: ['Balcão', 'Entrega'] })],
    observacoes: [(v, f) => v ? validators.string(v, f, { maxLength: 500 }) : null],
    itens: [validators.required, (v, f) => validators.array(v, f, { minLength: 1, maxLength: 20 })]
  },

  itemPedido: {
    produto_id: [validators.required, (v, f) => validators.number(v, f, { min: 1 })],
    produto_nome: [validators.required, (v, f) => validators.string(v, f, { minLength: 2, maxLength: 100 })],
    quantidade: [validators.required, (v, f) => validators.number(v, f, { min: 1, max: 100 })],
    preco_unitario: [validators.required, (v, f) => validators.number(v, f, { min: 0 })],
    observacoes: [(v, f) => v ? validators.string(v, f, { maxLength: 200 }) : null]
  }
};

/**
 * Valida dados contra um esquema
 */
export function validateData(data, schema) {
  const errors = [];
  
  for (const [field, validatorFunctions] of Object.entries(schema)) {
    const value = data[field];
    
    // Verificar se validatorFunctions é um array
    if (!Array.isArray(validatorFunctions)) {
      console.warn(`Schema inválido para campo '${field}': deve ser um array de funções`);
      continue;
    }
    
    for (const validatorFn of validatorFunctions) {
      if (typeof validatorFn === 'function') {
        const error = validatorFn(value, field);
        if (error) {
          errors.push(error);
          break; // Para no primeiro erro do campo
        }
      }
    }
  }
  
  return errors;
}

/**
 * Middleware de validação
 */
export function validateRequest(schema) {
  return async (request, env, ctx) => {
    try {
      // Verificar Content-Type para requisições com body
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          return new Response(JSON.stringify({
            error: 'Content-Type deve ser application/json',
            code: 'INVALID_CONTENT_TYPE'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
      }
      
      // Obter dados do body se existir
      let data = {};
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          data = await request.json();
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'JSON inválido no corpo da requisição',
            code: 'INVALID_JSON'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
      }
      
      // Validar dados
      const errors = validateData(data, schema);
      
      if (errors.length > 0) {
        return new Response(JSON.stringify({
          error: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          details: errors
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Adicionar dados validados à requisição
      request.validatedData = data;
      
      return null; // Continuar
    } catch (error) {
      console.error('Erro na validação:', error);
      return new Response(JSON.stringify({
        error: 'Erro interno de validação',
        code: 'VALIDATION_INTERNAL_ERROR'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  };
}

/**
 * Sanitiza dados de entrada (remove campos não permitidos)
 */
export function sanitizeData(data, allowedFields) {
  const sanitized = {};
  
  for (const field of allowedFields) {
    if (data.hasOwnProperty(field)) {
      sanitized[field] = data[field];
    }
  }
  
  return sanitized;
}

/**
 * Valida parâmetros de URL
 */
export function validateUrlParams(params, schema) {
  const errors = [];
  
  // Verificar se params e schema existem
  if (!params || !schema) {
    return errors;
  }
  
  for (const [param, validatorFunctions] of Object.entries(schema)) {
    const value = params[param];
    
    // Verificar se validatorFunctions é um array
    if (!Array.isArray(validatorFunctions)) {
      continue;
    }
    
    for (const validatorFn of validatorFunctions) {
      if (typeof validatorFn === 'function') {
        const error = validatorFn(value, param);
        if (error) {
          errors.push(error);
          break;
        }
      }
    }
  }
  
  return errors;
}

/**
 * Middleware para validar tamanho da requisição
 */
export function validateRequestSize(maxSizeBytes = 1024 * 1024) { // 1MB por padrão
  return async (request, env, ctx) => {
    const contentLength = request.headers.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return new Response(JSON.stringify({
        error: 'Requisição muito grande',
        code: 'REQUEST_TOO_LARGE',
        maxSize: maxSizeBytes
      }), {
        status: 413,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    return null; // Continue para próximo middleware
  };
}