const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sales_manager_jwt_secret_2025';

// ✅ MIDDLEWARE DE AUTENTICAÇÃO COMPLETAMENTE CORRIGIDO
const authMiddleware = (req, res, next) => {
  try {
    console.log('🔐 Iniciando verificação de autenticação...');
    console.log('📨 Headers recebidos:', {
      authorization: req.headers.authorization ? 'PRESENTE' : 'AUSENTE',
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']
    });

    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('❌ Token não fornecido - Header Authorization ausente');
      return res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido',
        details: 'Header Authorization está ausente'
      });
    }

    // ✅ CORREÇÃO: Suportar tanto "Bearer token" quanto apenas o token
    let token;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Token inválido ou vazio:', token);
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        details: 'Token está vazio ou mal formatado'
      });
    }

    console.log('🔐 Token recebido (primeiros 20 chars):', token.substring(0, 20) + '...');

    // ✅ CORREÇÃO: Verificar token com mais detalhes
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token válido para:', decoded.username, '- UserID:', decoded.userId);
      
      // Adicionar usuário à requisição
      req.user = decoded;
      
      next();
    } catch (jwtError) {
      console.error('❌ Erro na verificação JWT:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expirado',
          details: 'Faça login novamente'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
          details: jwtError.message
        });
      }

      throw jwtError;
    }
    
  } catch (error) {
    console.error('❌ Erro crítico no middleware de autenticação:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno na autenticação',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = authMiddleware;