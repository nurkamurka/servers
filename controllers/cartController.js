import { Cart, CartProduct, Product } from "../model/model.js"
import { totalPrice } from "../utils/totalPrice.js"

class CartController {
    async addCart(req, res) {
        try {
            const { productId, quantity = 1, size } = req.body
            const sessionId = req.sessionId

            const product = await Product.findByPk(productId)

            if (!product) {
                return res.status(404).json({ message: "Такого товара не существует" })
            }

            const totalPriceProduct = totalPrice({ size, price: product.price, quantity })
            const totalDiscountProduct = totalPrice({ size, price: product.discount, quantity })

            let cart = await Cart.findOne({ where: { sessionId } })

            if (!cart) {
                cart = await Cart.create({ sessionId })
            }

            const cartItem = await CartProduct.findOne({ where: { cartId: sessionId, size, productId } })

            if (cartItem) {
                return res.status(400).json({ message: "Товар уже добавлен в корзину" })
            }

            await CartProduct.create({ cartId: sessionId, productId, quantity, size, total: totalPriceProduct, totalDiscount: totalDiscountProduct })

            const cartProducts = await CartProduct.findAll({ where: { cartId: sessionId }, include: [Product], order: [["createdAt", "DESC"]] })

            return res.status(200).json({ cartProducts, message: "Товар успешно добавлен в корзину" })

        } catch (err) {
            console.error(err)
            return res.status(500).json({ message: "Ошибка сервера" })
        }
    }

    async getCart(req, res) {
        try {
            const sessionId = req.sessionId

            const cartItem = await CartProduct.findAll({ where: { cartId: sessionId }, include: [Product], order: [["createdAt", "DESC"]] })

            return res.status(200).json({ cartItem })

        } catch (err) {
            console.error(err)
            return res.status(500).json({ message: "Ошибка сервера" })
        }
    }

    async deleteCart(req, res) {
        try {
            const { id } = req.params
            const sessionId = req.sessionId

            if (!id) {
                return res.status(404).json({ message: "Такого товара не существует" })
            }

            await CartProduct.destroy({ where: { cartId: sessionId, id } })

            const cartProducts = await CartProduct.findAll({ where: { cartId: sessionId }, include: [Product], order: [["createdAt", "DESC"]] })

            return res.status(200).json({ cartProducts, message: "Товар успешно удален из корзины" })
        } catch (err) {
            console.error(err)
            return res.status(500).json({ message: "Ошибка сервера" })
        }
    }

    async updateCart(req, res) {
        const { id } = req.params
        const { quantity } = req.body
        const sessionId = req.sessionId

        if (!id) {
            return res.status(404).json({ message: "Такого товара в корзине не существует" })
        }

        if (!quantity) {
            return res.status(400).json({ message: "Не все поля заполнены" })
        }

        try {

            if (quantity < 1) {
                return res.status(400).json({ message: "Количество товара не может быть меньше 1" })
            }

            const cart = await CartProduct.findOne({ where: { id, cartId: sessionId } })

            if (!cart) {
                return res.status(404).json({ message: "Такого товара в корзине не существует" })
            }

            const product = await Product.findOne({ where: { id: cart.productId } })

            if (!product) {
                return res.status(404).json({ message: "Такого товара не существует" })
            }

            const totalPriceProduct = totalPrice({ size: cart.size, price: product.price, quantity })
            const totalDiscountProduct = totalPrice({ size: cart.size, price: product.discount, quantity })

            await CartProduct.update({ quantity, total: totalPriceProduct, totalDiscount: totalDiscountProduct }, { where: { id, cartId: sessionId } })

            const updateCart = await CartProduct.findOne({ where: { id, cartId: sessionId }, include: [Product] })

            return res.status(200).json({ updateCart })

        } catch (err) {
            console.error(err)
            return res.status(500).json({ message: "Ошибка сервера" })
        }
    }
}

export default new CartController()