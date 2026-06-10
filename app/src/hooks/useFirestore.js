import { useCallback } from "react";
import { loadCollection, getDocumentById } from "../lib/data";
import { parseProductFromArray } from "../utils/product.utils";

export const useFirestore = (db, collectionName = "home") => {
  const getAllDocs = useCallback(async () => {
    return await loadCollection(collectionName);
  }, [collectionName]);

  const addDocData = useCallback(async (data) => {
    // Mock: chỉ return local ID
    console.warn(`addDocData to ${collectionName}: Chỉ update local state`);
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, [collectionName]);

  const updateDocData = useCallback(async (id, data) => {
    // Mock: chỉ log
    console.warn(`updateDocData ${collectionName}/${id}: Chỉ update local state`);
  }, [collectionName]);

  const deleteDocData = useCallback(async (id) => {
    // Mock: chỉ log
    console.warn(`deleteDocData ${collectionName}/${id}: Chỉ update local state`);
  }, [collectionName]);

  const getAllDocsWithSubcollections = useCallback(
    async (collectionNames = []) => {
      const allProducts = [];

      for (const name of collectionNames) {
        const data = await loadCollection(name);

        for (const docSnap of data) {
          const rawDoc = docSnap;

          for (const [key, value] of Object.entries(rawDoc)) {
            if (key === "id") continue;

            if (typeof value === "string") {
              const rawArray = value
                .split("|")
                .map((item) => (item === "null" ? "" : item.trim()));

              rawArray.unshift(key);

              const product = parseProductFromArray(rawArray);
              allProducts.push(product);
            }
          }
        }
      }

      return allProducts;
    },
    []
  );

  return {
    getAllDocsWithSubcollections,
    getAllDocs,
    addDocData,
    updateDocData,
    deleteDocData,
  };
};