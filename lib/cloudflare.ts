export async function createSubdomain(subdomain: string, githubPagesUrl: string) {
  const token = process.env.CLOUDFLARE_API_TOKEN!
  const zoneId = process.env.CLOUDFLARE_ZONE_ID!

  try {
    // Extract just the domain from the GitHub Pages URL (remove https:// and any paths)
    const targetDomain = githubPagesUrl.replace("https://", "").replace("http://", "").split("/")[0]

    console.log(`Creating CNAME record: ${subdomain}.sriox.com -> ${targetDomain}`)

    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "CNAME",
        name: `${subdomain}.sriox.com`,
        content: targetDomain,
        ttl: 1, // Auto TTL
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Cloudflare API error:", error)
      throw new Error(`Cloudflare API error: ${error.errors?.[0]?.message || response.statusText}`)
    }

    const result = await response.json()
    console.log("Cloudflare DNS record created successfully:", result)
    return result
  } catch (error) {
    console.error("Cloudflare create error:", error)
    throw error
  }
}

export async function updateSubdomainTarget(subdomain: string, newTarget: string) {
  const token = process.env.CLOUDFLARE_API_TOKEN!
  const zoneId = process.env.CLOUDFLARE_ZONE_ID!

  try {
    // Clean the target domain
    const cleanTarget = newTarget.replace("https://", "").replace("http://", "").split("/")[0]

    // First, find the DNS record
    const listResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${subdomain}.sriox.com`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!listResponse.ok) {
      throw new Error("Failed to find DNS record")
    }

    const listData = await listResponse.json()
    const record = listData.result?.[0]

    if (!record) {
      // If record doesn't exist, create it
      return await createSubdomain(subdomain, `https://${cleanTarget}`)
    }

    // Update the DNS record
    const updateResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CNAME",
          name: `${subdomain}.sriox.com`,
          content: cleanTarget,
          ttl: 1,
        }),
      },
    )

    if (!updateResponse.ok) {
      const error = await updateResponse.json()
      throw new Error(`Failed to update DNS record: ${error.errors?.[0]?.message || updateResponse.statusText}`)
    }

    return await updateResponse.json()
  } catch (error) {
    console.error("Cloudflare update error:", error)
    throw error
  }
}

export async function deleteSubdomain(subdomain: string) {
  const token = process.env.CLOUDFLARE_API_TOKEN!
  const zoneId = process.env.CLOUDFLARE_ZONE_ID!

  try {
    // First, find the DNS record
    const listResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${subdomain}.sriox.com`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!listResponse.ok) {
      throw new Error("Failed to find DNS record")
    }

    const listData = await listResponse.json()
    const record = listData.result?.[0]

    if (!record) {
      console.log("DNS record not found, might already be deleted")
      return { success: true }
    }

    // Delete the DNS record
    const deleteResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json()
      throw new Error(`Failed to delete DNS record: ${error.errors?.[0]?.message || deleteResponse.statusText}`)
    }

    return await deleteResponse.json()
  } catch (error) {
    console.error("Cloudflare delete error:", error)
    throw error
  }
}
