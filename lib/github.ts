import { Buffer } from "buffer"

export async function createRepository(subdomain: string, filesToUpload: { filename: string; content: string }[]) {
  const token = process.env.GITHUB_TOKEN!
  const username = process.env.GITHUB_USERNAME!

  const repoName = `sriox-${subdomain}`
  const customDomain = `${subdomain}.sriox.com`

  try {
    console.log(`Creating repository: ${repoName}`)

    // 1. Create a new repository
    const createRepoResponse = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        description: `Sriox site for ${customDomain}`,
        private: false, // Must be public for GitHub Pages to work on free accounts
        auto_init: false,
        has_issues: false,
        has_projects: false,
        has_wiki: false,
      }),
    })

    if (!createRepoResponse.ok) {
      const error = await createRepoResponse.json()
      console.error("GitHub repo creation error:", error)
      throw new Error(`Failed to create repository: ${error.message}`)
    }

    const repoData = await createRepoResponse.json()
    console.log("Repository created successfully")

    const fileShas: { filename: string; sha: string }[] = []

    // 2. Create all files in the repository
    console.log("Creating project files in repository...")
    for (const file of filesToUpload) {
      const fileContentBase64 = Buffer.from(file.content).toString("base64")
      const filePath = file.filename // Assuming flat structure for now, adjust if nested folders are needed

      const createFileResponse = await fetch(
        `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Add ${filePath} for ${subdomain} site`,
            content: fileContentBase64,
          }),
        },
      )

      if (!createFileResponse.ok) {
        const error = await createFileResponse.json()
        console.error(`GitHub file creation error for ${filePath}:`, error)
        console.warn(`Failed to create file ${filePath}: ${error.message}`)
      } else {
        const fileResult = await createFileResponse.json()
        fileShas.push({ filename: filePath, sha: fileResult.content.sha })
        console.log(`${filePath} created successfully with SHA: ${fileResult.content.sha}`)
      }
    }

    // 3. Create CNAME file for custom domain
    console.log("Creating CNAME file for custom domain...")
    const cnameContent = Buffer.from(customDomain).toString("base64")

    const createCnameResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/CNAME`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Add CNAME for ${customDomain}`,
        content: cnameContent,
      }),
    })

    if (!createCnameResponse.ok) {
      const error = await createCnameResponse.json()
      console.error("GitHub CNAME creation error:", error)
      console.log("CNAME file creation failed, but continuing...")
    } else {
      console.log("CNAME file created successfully")
    }

    // 4. Enable GitHub Pages
    console.log("Enabling GitHub Pages...")
    const enablePagesResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: {
          branch: "main",
          path: "/",
        },
      }),
    })

    if (!enablePagesResponse.ok) {
      const error = await enablePagesResponse.json()
      console.error("GitHub Pages enable error:", error)
      console.log("GitHub Pages might already be enabled or will be available shortly")
    } else {
      console.log("GitHub Pages enabled successfully")
    }

    // 5. Configure custom domain (without HTTPS enforcement initially)
    console.log("Configuring custom domain...")
    await new Promise((resolve) => setTimeout(resolve, 3000)) // Wait 3 seconds

    try {
      const updatePagesResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cname: customDomain,
          https_enforced: false, // Don't enforce HTTPS initially
          source: {
            branch: "main",
            path: "/",
          },
        }),
      })

      if (updatePagesResponse.ok) {
        console.log("Custom domain configured successfully (HTTPS will be enabled later)")
      } else {
        const error = await updatePagesResponse.json()
        console.log("Custom domain configuration will be handled automatically:", error.message)
      }
    } catch (domainError) {
      console.log("Domain configuration will be handled automatically by GitHub")
    }

    const pagesUrl = `https://${username}.github.io/${repoName}`

    return {
      repoName,
      repoUrl: repoData.html_url,
      pagesUrl,
      customDomain,
      fileShas, // Return SHAs for Supabase storage
    }
  } catch (error) {
    console.error("GitHub repository creation error:", error)
    throw error
  }
}

export async function enableHttpsForSite(subdomain: string) {
  const token = process.env.GITHUB_TOKEN!
  const username = process.env.GITHUB_USERNAME!
  const repoName = `sriox-${subdomain}`
  const customDomain = `${subdomain}.sriox.com`

  try {
    console.log(`Checking HTTPS status for ${customDomain}...`)

    // First, get current Pages configuration
    const getPagesResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!getPagesResponse.ok) {
      const error = await getPagesResponse.json()
      throw new Error(`Failed to get Pages configuration: ${error.message}`)
    }

    const pagesData = await getPagesResponse.json()
    console.log("Current Pages status:", pagesData.status)
    console.log("HTTPS enforced:", pagesData.https_enforced)
    console.log("Custom domain:", pagesData.cname)

    // Check if HTTPS is already enabled
    if (pagesData.https_enforced) {
      return {
        success: true,
        message: "HTTPS is already enabled",
        status: pagesData.status,
      }
    }

    // Check if the site is ready for HTTPS
    if (pagesData.status !== "built") {
      throw new Error(
        `Site is not ready yet. Current status: ${pagesData.status}. Please wait a few minutes and try again.`,
      )
    }

    // Try to enable HTTPS enforcement
    console.log("Attempting to enable HTTPS enforcement...")
    const updateResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cname: customDomain,
        https_enforced: true,
        source: pagesData.source,
      }),
    })

    if (!updateResponse.ok) {
      const error = await updateResponse.json()
      console.error("HTTPS enable error:", error)

      // Handle specific error cases
      if (error.message?.includes("certificate") || error.message?.includes("SSL")) {
        throw new Error("SSL certificate is not ready yet. Please wait 10-15 minutes after domain setup and try again.")
      } else if (error.message?.includes("domain")) {
        throw new Error("Domain verification is still in progress. Please wait a few minutes and try again.")
      } else {
        throw new Error(`Failed to enable HTTPS: ${error.message}`)
      }
    }

    const result = await updateResponse.json()
    console.log(`HTTPS enabled successfully for ${customDomain}`)

    return {
      success: true,
      message: "HTTPS enabled successfully",
      status: result.status,
    }
  } catch (error: any) {
    console.error("HTTPS enable error:", error)
    throw error
  }
}

export async function checkHttpsStatus(subdomain: string) {
  const token = process.env.GITHUB_TOKEN!
  const username = process.env.GITHUB_USERNAME!
  const repoName = `sriox-${subdomain}`

  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to check status: ${error.message}`)
    }

    const data = await response.json()

    return {
      status: data.status,
      httpsEnforced: data.https_enforced,
      customDomain: data.cname,
      url: data.html_url,
      ready: data.status === "built",
      canEnableHttps: data.status === "built" && !data.https_enforced,
    }
  } catch (error: any) {
    console.error("Status check error:", error)
    throw error
  }
}

// New function to get file content from GitHub
export async function getFileContentFromGitHub(subdomain: string, filePath: string) {
  const token = process.env.GITHUB_TOKEN!
  const username = process.env.GITHUB_USERNAME!
  const repoName = `sriox-${subdomain}`

  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3.raw", // Request raw content
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to fetch file content from GitHub: ${error.message}`)
    }

    return await response.text() // Return raw text content
  } catch (error) {
    console.error(`Error fetching file ${filePath} from GitHub:`, error)
    throw error
  }
}

// Modified function to update a specific file on GitHub
export async function updateFileInRepository(subdomain: string, filePath: string, newContent: string, sha: string) {
  const token = process.env.GITHUB_TOKEN!
  const username = process.env.GITHUB_USERNAME!
  const repoName = `sriox-${subdomain}`

  try {
    const contentBase64 = Buffer.from(newContent).toString("base64")

    const updateResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Update ${filePath} for ${subdomain} site`,
        content: contentBase64,
        sha: sha, // Required for updating existing files
      }),
    })

    if (!updateResponse.ok) {
      const error = await updateResponse.json()
      throw new Error(`GitHub API error updating ${filePath}: ${error.message}`)
    }

    const result = await updateResponse.json()
    return {
      success: true,
      newSha: result.content.sha, // Return the new SHA
      commitUrl: result.commit.html_url,
    }
  } catch (error) {
    console.error(`GitHub update error for ${filePath}:`, error)
    throw error
  }
}

export async function deleteRepository(subdomain: string) {
  const token = process.env.GITHUB_TOKEN!
  const username = process.env.GITHUB_USERNAME!
  const repoName = `sriox-${subdomain}`

  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok && response.status !== 404) {
      const error = await response.json()
      throw new Error(`GitHub API error: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error("GitHub delete error:", error)
    throw error
  }
}

// Legacy functions for backward compatibility (can be removed later)
export async function uploadToGitHub(subdomain: string, htmlContent: string) {
  return createRepository(subdomain, [{ filename: "index.html", content: htmlContent }])
}

export async function deleteFromGitHub(subdomain: string) {
  return deleteRepository(subdomain)
}
