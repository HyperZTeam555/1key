const rawBasePath = (process.env.NEXT_BASE_PATH || "").trim()
const normalizedBasePath =
  rawBasePath && rawBasePath !== "/"
    ? rawBasePath.replace(/\/+$/, "")
    : ""

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(normalizedBasePath
    ? {
        basePath: normalizedBasePath,
        assetPrefix: `${normalizedBasePath}/`,
      }
    : {}),
};

export default nextConfig;
