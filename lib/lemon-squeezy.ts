export const LEMON_SQUEEZY_PRODUCT_ID = process.env.LEMON_SQUEEZY_PRODUCT_ID
export const LEMON_SQUEEZY_VARIANT_ID = process.env.LEMON_SQUEEZY_VARIANT_ID
export const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY
export const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID
export const LEMON_SQUEEZY_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET

interface CreateCheckoutParams {
  userId: string
  userEmail: string
  variantId: string
}

export async function createCheckout({ userId, userEmail, variantId }: CreateCheckoutParams) {
  console.log("[v0] Creating checkout for user:", userId, "Variant:", variantId, "Store:", LEMON_SQUEEZY_STORE_ID)

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: userEmail,
            custom: {
              user_id: userId,
            },
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(LEMON_SQUEEZY_STORE_ID), // Đảm bảo ID là chuỗi
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId), // Đảm bảo ID là chuỗi
            },
          },
        },
      },
    }),
  })

  const checkout = await response.json()

  if (!response.ok) {
    console.error("[v0] Lemon Squeezy API Error:", JSON.stringify(checkout, null, 2))
    throw new Error(checkout.errors?.[0]?.detail || "Failed to create checkout URL")
  }

  return checkout.data.attributes.url
}
