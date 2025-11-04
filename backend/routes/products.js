const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ✅ LISTAR PRODUTOS CORRIGIDO
router.get('/', authMiddleware, (req, res) => {
    try {
        console.log('📦 Buscando produtos...');

        const stmt = db.prepare(`
            SELECT p.*, c.name as category_name, i.current_stock 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            LEFT JOIN inventory i ON p.id = i.product_id 
            WHERE p.is_active = 1
            ORDER BY p.name
        `);
        
        const products = stmt.all();

        console.log(`✅ ${products.length} produtos encontrados`);
        console.log('📋 Produtos:', products.map(p => ({ id: p.id, name: p.name, stock: p.current_stock })));

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// ✅ OBTER PRODUTO POR ID
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const productId = req.params.id;
        console.log('📦 Buscando produto ID:', productId);

        const stmt = db.prepare(`
            SELECT p.*, c.name as category_name, i.current_stock 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            LEFT JOIN inventory i ON p.id = i.product_id 
            WHERE p.id = ?
        `);
        
        const product = stmt.get(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Produto não encontrado'
            });
        }

        console.log('✅ Produto encontrado:', product.name);

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('❌ Erro ao buscar produto:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// ✅ CRIAR PRODUTO CORRIGIDO
router.post('/', authMiddleware, (req, res) => {
    try {
        const { name, price, category_id, stock_initial } = req.body;

        console.log('🆕 Criando produto:', { name, price, category_id, stock_initial });

        const stock = parseInt(stock_initial) || 0;
        
        if (!name || !price || !category_id) {
            return res.status(400).json({
                success: false,
                error: 'Nome, preço e categoria são obrigatórios'
            });
        }

        db.exec('BEGIN TRANSACTION');

        try {
            const productStmt = db.prepare(`
                INSERT INTO products (name, price, category_id, created_at, updated_at) 
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);

            const productResult = productStmt.run(name, parseFloat(price), parseInt(category_id));
            const productId = productResult.lastInsertRowid;

            console.log('✅ Produto criado com ID:', productId);

            const inventoryStmt = db.prepare(`
                INSERT INTO inventory (product_id, current_stock, min_stock, created_at, updated_at) 
                VALUES (?, ?, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);
            
            inventoryStmt.run(productId, stock);

            const movementStmt = db.prepare(`
                INSERT INTO stock_movements (product_id, quantity, type, reason, user_id, created_at) 
                VALUES (?, ?, 'entrada', 'Estoque inicial', ?, CURRENT_TIMESTAMP)
            `);
            
            movementStmt.run(productId, stock, req.user.userId);

            db.exec('COMMIT');

            console.log('✅ Estoque e movimentação registrados');

            res.json({
                success: true,
                data: {
                    id: productId,
                    name,
                    price: parseFloat(price),
                    category_id: parseInt(category_id),
                    stock_initial: stock
                },
                message: 'Produto criado com sucesso'
            });

        } catch (error) {
            db.exec('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('❌ Erro ao criar produto:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ ATUALIZAR PRODUTO COMPLETO
router.put('/:id', authMiddleware, (req, res) => {
    try {
        const productId = req.params.id;
        const { name, price, category_id, description, is_active } = req.body;

        console.log('✏️ Atualizando produto:', { productId, name, price, category_id, description, is_active });

        if (!name || !price || !category_id) {
            return res.status(400).json({
                success: false,
                error: 'Nome, preço e categoria são obrigatórios'
            });
        }

        const stmt = db.prepare(`
            UPDATE products 
            SET name = ?, price = ?, category_id = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);

        const result = stmt.run(
            name, 
            parseFloat(price), 
            parseInt(category_id),
            description || null,
            is_active ? 1 : 0,
            productId
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Produto não encontrado'
            });
        }

        console.log('✅ Produto atualizado com sucesso');

        res.json({
            success: true,
            message: 'Produto atualizado com sucesso',
            data: {
                id: parseInt(productId),
                name,
                price: parseFloat(price),
                category_id: parseInt(category_id),
                description,
                is_active: is_active ? 1 : 0
            }
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar produto:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// ✅ EXCLUIR PRODUTO (soft delete)
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        const productId = req.params.id;
        console.log('🗑️ Excluindo produto:', productId);

        const stmt = db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const result = stmt.run(productId);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Produto não encontrado'
            });
        }

        console.log('✅ Produto excluído com sucesso');

        res.json({
            success: true,
            message: 'Produto excluído com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao excluir produto:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// ✅ OBTER CATEGORIAS
router.get('/categories', authMiddleware, (req, res) => {
    try {
        console.log('📂 Buscando categorias...');

        const stmt = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY name');
        const categories = stmt.all();

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

module.exports = router;