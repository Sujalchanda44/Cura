// This is a placeholder for the scanner API
export const scanFood = async (imageBlob: Blob) => {
  console.log("Analyzing image blob...", imageBlob);
  return { productId: "123", success: true };
};

export const scanBarcode = async (barcode: string) => {
  console.log("Scanning barcode:", barcode);
  return { productId: "123", success: true };
};

export const getProductDetails = async (productId: string) => {
  return {
    id: productId,
    name: "Dark Chocolate Protein Bar",
    brand: "HealthyLife Co.",
    score: 92,
    calories: 210,
    protein: "20g",
    carbs: "24g",
    fat: "8g"
  };
};
