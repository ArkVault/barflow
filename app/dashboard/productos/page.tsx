"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProdShell } from "@/components/shells";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { GlowButton } from "@/components/glow-button";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/hooks/use-language";
import { MenuManager, MenuData } from "@/components/menu-manager";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { optimizeImage, isValidImageFile } from "@/lib/image-optimizer";

interface Product {
  id: string | number;
  name: string;
  category: string;
  price: number;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  active: boolean;
  description?: string;
  menu_id?: string;
  image_url?: string | null;
}

export default function ProductosPage() {
  const { t, language } = useLanguage();
  const { establishmentId, establishmentName, user } = useAuth();
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [secondaryMenuId, setSecondaryMenuId] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; icon: string }>
  >([]);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // State for viewing products of a specific menu
  const [selectedMenu, setSelectedMenu] = useState<MenuData | null>(null);

  // Image upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editSelectedImageFile, setEditSelectedImageFile] =
    useState<File | null>(null);
  const [isEditOptimizing, setIsEditOptimizing] = useState(false);

  const [newProduct, setNewProduct] = useState<Product>({
    id: 0,
    name: "",
    category: "",
    price: 0,
    ingredients: [{ name: "", quantity: 0, unit: "" }],
    active: true,
    description: "",
    image_url: null,
  });

  // Load categories from Supabase
  useEffect(() => {
    const loadCategories = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name, icon")
        .order("display_order");

      if (!error && data) {
        setCategories(data);
      }
    };

    loadCategories();
  }, []);

  // Helper function to translate category
  const translateCategory = (category: string) => {
    if (language === "es") return category;

    const categoryMap: Record<string, string> = {
      Cócteles: "Cocktails",
      Cervezas: "Beers",
      Shots: "Shots",
      "Bebidas sin alcohol": "Non-alcoholic drinks",
      Alimentos: "Food",
      Postres: "Desserts",
      Entradas: "Appetizers",
      Vinos: "Wines",
    };
    return categoryMap[category] || category;
  };

  // Load products from Supabase when menu changes
  const handleMenuChange = async (menuId: string) => {
    setActiveMenuId(menuId);
    loadProductsForMenus(menuId, secondaryMenuId);
  };

  // Handle both primary and secondary menu changes
  const handleActiveMenusChange = async (
    primaryMenuId: string | null,
    secondaryMenuIdNew: string | null,
  ) => {
    setActiveMenuId(primaryMenuId || "");
    setSecondaryMenuId(secondaryMenuIdNew);
    if (!selectedMenu) {
      loadProductsForMenus(primaryMenuId, secondaryMenuIdNew);
    }
  };

  // Handle click on a menu card to view its products
  const handleMenuClick = async (menu: MenuData) => {
    setSelectedMenu(menu);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("menu_id", menu.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading products for menu:", error);
        setProducts([]);
        return;
      }

      const loadedProducts = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || "Cócteles",
        price: parseFloat(p.price) || 0,
        description: p.description || "",
        active: p.is_active,
        menu_id: p.menu_id,
        image_url: p.image_url,
        ingredients: [],
      }));

      setProducts(loadedProducts);
    } catch (error) {
      console.error("Error loading products for menu:", error);
      setProducts([]);
    }
  };

  // Handle going back to menu management view
  const handleBackToMenus = () => {
    setSelectedMenu(null);
    loadProductsForMenus(activeMenuId, secondaryMenuId);
  };

  // Load products for one or both menus
  const loadProductsForMenus = async (
    primaryId: string | null,
    secondaryId: string | null,
  ) => {
    const menuIds = [primaryId, secondaryId].filter(Boolean) as string[];

    if (menuIds.length === 0) {
      setProducts([]);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("menu_id", menuIds)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading products:", error);
        toast.error(
          language === "es"
            ? "Error al cargar productos"
            : "Error loading products",
        );
        setProducts([]);
        return;
      }

      const products = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || "Cócteles",
        price: parseFloat(p.price) || 0,
        description: p.description || "",
        active: p.is_active,
        menu_id: p.menu_id,
        image_url: p.image_url,
        ingredients: [],
      }));

      setProducts(products);
      setAllProducts(products);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    }
  };

  // Load products on mount
  useEffect(() => {
    const menuIds = [activeMenuId, secondaryMenuId].filter(Boolean) as string[];
    if (menuIds.length > 0) {
      loadProductsForMenus(activeMenuId, secondaryMenuId);
    } else {
      setProducts([]);
    }
  }, [activeMenuId, secondaryMenuId]);

  // === STORAGE HELPER FUNCTIONS ===

  const getStoragePathFromUrl = (
    url: string | null | undefined,
  ): string | null => {
    if (!url) return null;
    try {
      const match = url.match(/\/products\/(product-images\/[^?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const deleteProductImage = async (
    imageUrl: string | null | undefined,
  ): Promise<void> => {
    if (!imageUrl) return;
    const filePath = getStoragePathFromUrl(imageUrl);
    if (!filePath) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("products")
        .remove([filePath]);

      if (error) {
        console.error("Error deleting old image:", error);
      }
    } catch (error) {
      console.error("Error deleting old image:", error);
    }
  };

  const uploadProductImage = async (
    file: File,
    productId: string,
    oldImageUrl?: string | null,
  ): Promise<string | null> => {
    const supabase = createClient();

    if (oldImageUrl) {
      await deleteProductImage(oldImageUrl);
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(
        language === "es"
          ? "Error al subir la imagen"
          : "Error uploading image",
      );
    }

    const { data } = supabase.storage.from("products").getPublicUrl(filePath);

    return data.publicUrl;
  };

  // === END STORAGE HELPER FUNCTIONS ===

  const handleEdit = (productId: string | number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setEditForm({ ...product });
      setEditImagePreview(null);
      setEditSelectedImageFile(null);
    }
  };

  const handleSaveEdit = async () => {
    if (editForm) {
      try {
        const supabase = createClient();
        let finalImageUrl = editForm.image_url;

        if (editSelectedImageFile) {
          finalImageUrl = await uploadProductImage(
            editSelectedImageFile,
            String(editForm.id),
            editingProduct?.image_url,
          );
        } else if (editForm.image_url === null && editingProduct?.image_url) {
          await deleteProductImage(editingProduct.image_url);
        }

        const { error } = await supabase
          .from("products")
          .update({
            name: editForm.name,
            category: editForm.category,
            price: editForm.price,
            description: editForm.description,
            image_url: finalImageUrl,
          })
          .eq("id", editForm.id);

        if (error) {
          toast.error(
            language === "es"
              ? "Error al guardar cambios"
              : "Error saving changes",
          );
          console.error("Error saving product:", error);
          return;
        }

        const updatedProduct = { ...editForm, image_url: finalImageUrl };
        setProducts(
          products.map((p) => (p.id === editForm.id ? updatedProduct : p)),
        );
        setAllProducts(
          allProducts.map((p) => (p.id === editForm.id ? updatedProduct : p)),
        );

        toast.success(
          language === "es" ? "Producto actualizado" : "Product updated",
        );

        setEditingProduct(null);
        setEditForm(null);
        setEditImagePreview(null);
        setEditSelectedImageFile(null);
      } catch (error) {
        console.error("Error saving product:", error);
        toast.error(
          language === "es"
            ? "Error al guardar cambios"
            : "Error saving changes",
        );
      }
    }
  };

  const handleDelete = (productId: string | number) => {
    const confirmMsg =
      language === "es"
        ? "¿Estás seguro de que quieres eliminar este producto?"
        : "Are you sure you want to delete this product?";
    if (confirm(confirmMsg)) {
      setProducts(products.filter((p) => p.id !== productId));
    }
  };

  const handleViewRecipe = (productId: string | number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setViewingProduct(product);
    }
  };

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.category && newProduct.price > 0) {
      const targetMenuId = selectedMenu?.id || activeMenuId;

      if (!targetMenuId) {
        toast.error(
          language === "es"
            ? "Por favor selecciona un menú primero"
            : "Please select a menu first",
        );
        return;
      }

      try {
        const supabase = createClient();

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          console.error("Auth error:", authError);
          toast.error(
            language === "es"
              ? "Error de autenticación"
              : "Authentication error",
          );
          return;
        }

        const productData = {
          menu_id: targetMenuId,
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          description: newProduct.description || null,
          image_url: newProduct.image_url || null,
          is_active: true,
        };

        const response = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();

        if (response.error) {
          console.error("Error adding product:", response.error);
          toast.error(
            `Error: ${response.error.message || response.error.code || "Error desconocido"}`,
          );
          return;
        }

        if (response.data) {
          let finalImageUrl = null;
          if (selectedImageFile) {
            try {
              finalImageUrl = await uploadProductImage(
                selectedImageFile,
                response.data.id,
              );

              await supabase
                .from("products")
                .update({ image_url: finalImageUrl })
                .eq("id", response.data.id);
            } catch (imgError) {
              console.error("Error uploading image:", imgError);
            }
          }

          const productToAdd = {
            ...newProduct,
            id: response.data.id,
            menu_id: targetMenuId,
            image_url: finalImageUrl,
            ingredients: newProduct.ingredients.filter(
              (ing) => ing.name && ing.quantity > 0,
            ),
          };

          setAllProducts([...allProducts, productToAdd]);
          setProducts([...products, productToAdd]);

          toast.success(
            language === "es"
              ? "Producto agregado exitosamente"
              : "Product added successfully",
          );
        }

        setIsAddingProduct(false);

        setNewProduct({
          id: 0,
          name: "",
          category: "",
          price: 0,
          ingredients: [{ name: "", quantity: 0, unit: "" }],
          active: true,
          description: "",
          image_url: null,
        });

        setSelectedImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error(
          language === "es"
            ? "Error inesperado al agregar producto"
            : "Unexpected error adding product",
        );
      }
    } else {
      toast.error(
        language === "es"
          ? "Por favor completa todos los campos requeridos"
          : "Please fill in all required fields",
      );
    }
  };

  const addIngredientToNew = () => {
    setNewProduct({
      ...newProduct,
      ingredients: [
        ...newProduct.ingredients,
        { name: "", quantity: 0, unit: "" },
      ],
    });
  };

  const removeIngredientFromNew = (index: number) => {
    setNewProduct({
      ...newProduct,
      ingredients: newProduct.ingredients.filter((_, idx) => idx !== index),
    });
  };

  // Image handlers for Add Product
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          language === "es"
            ? "La imagen debe ser menor a 10MB"
            : "Image must be less than 10MB",
        );
        return;
      }
      if (!isValidImageFile(file)) {
        toast.error(
          language === "es"
            ? "Solo se permiten archivos de imagen"
            : "Only image files are allowed",
        );
        return;
      }

      try {
        setIsOptimizing(true);
        toast.info(
          language === "es" ? "Optimizando imagen..." : "Optimizing image...",
        );

        const optimizedFile = await optimizeImage(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          fileType: "image/webp",
        });

        setSelectedImageFile(optimizedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(optimizedFile);

        const originalSizeKB = Math.round(file.size / 1024);
        const optimizedSizeKB = Math.round(optimizedFile.size / 1024);
        toast.success(
          `${language === "es" ? "Imagen optimizada" : "Image optimized"}: ${originalSizeKB}KB → ${optimizedSizeKB}KB`,
        );
      } catch (error) {
        console.error("Error optimizing image:", error);
        toast.error(
          language === "es"
            ? "Error al optimizar la imagen"
            : "Error optimizing image",
        );
      } finally {
        setIsOptimizing(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Image handlers for Edit Product
  const handleEditImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          language === "es"
            ? "La imagen debe ser menor a 10MB"
            : "Image must be less than 10MB",
        );
        return;
      }
      if (!isValidImageFile(file)) {
        toast.error(
          language === "es"
            ? "Solo se permiten archivos de imagen"
            : "Only image files are allowed",
        );
        return;
      }

      try {
        setIsEditOptimizing(true);
        toast.info(
          language === "es" ? "Optimizando imagen..." : "Optimizing image...",
        );

        const optimizedFile = await optimizeImage(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          fileType: "image/webp",
        });

        setEditSelectedImageFile(optimizedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
          setEditImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(optimizedFile);

        const originalSizeKB = Math.round(file.size / 1024);
        const optimizedSizeKB = Math.round(optimizedFile.size / 1024);
        toast.success(
          `${language === "es" ? "Imagen optimizada" : "Image optimized"}: ${originalSizeKB}KB → ${optimizedSizeKB}KB`,
        );
      } catch (error) {
        console.error("Error optimizing image:", error);
        toast.error(
          language === "es"
            ? "Error al optimizar la imagen"
            : "Error optimizing image",
        );
      } finally {
        setIsEditOptimizing(false);
      }
    }
  };

  const handleRemoveEditImage = () => {
    setEditSelectedImageFile(null);
    setEditImagePreview(null);
    if (editForm) {
      setEditForm({ ...editForm, image_url: null });
    }
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header - changes based on whether viewing specific menu products */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {selectedMenu ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToMenus}
                    className="gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 hover:from-violet-500/20 hover:via-purple-500/20 hover:to-fuchsia-500/20 border border-violet-500/30 hover:border-violet-500/50 transition-all duration-300 shadow-sm hover:shadow-md text-violet-700 dark:text-violet-300 font-medium"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    {language === "es"
                      ? "← Volver a Gestión de Menús"
                      : "← Back to Menu Management"}
                  </Button>
                </div>
                <h2
                  className="text-4xl font-bold mb-2"
                  style={{ fontFamily: "Satoshi, sans-serif" }}
                >
                  {selectedMenu.name}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">
                    {language === "es" ? "Productos del menú" : "Menu products"}
                  </p>
                  {selectedMenu.is_active && (
                    <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs">
                      {language === "es" ? "Principal" : "Primary"}
                    </Badge>
                  )}
                  {selectedMenu.is_secondary_active && (
                    <Badge
                      className="text-white text-xs"
                      style={{
                        background:
                          "linear-gradient(135deg, #B4A0D8 0%, #A8B0D8 100%)",
                      }}
                    >
                      {language === "es" ? "Secundario" : "Secondary"}
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2
                  className="text-4xl font-bold mb-2"
                  style={{ fontFamily: "Satoshi, sans-serif" }}
                >
                  {t("productManagement")}
                </h2>
                <p className="text-muted-foreground">{t("menuRecipes")}</p>
              </>
            )}
          </div>
        </div>

        {/* Menu Manager - only show when not viewing specific menu products */}
        {!selectedMenu && (
          <div className="mb-8">
            <MenuManager
              onMenuChange={handleMenuChange}
              onActiveMenusChange={handleActiveMenusChange}
              onMenuClick={handleMenuClick}
            />
          </div>
        )}

        {/* Add Product Button */}
        <div className="mb-8">
          <GlowButton onClick={() => setIsAddingProduct(true)}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-inner">
              <Plus className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="hidden sm:inline">{t("addProduct")}</span>
          </GlowButton>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-2">
              {selectedMenu
                ? language === "es"
                  ? `No hay productos en "${selectedMenu.name}"`
                  : `No products in "${selectedMenu.name}"`
                : activeMenuId
                  ? language === "es"
                    ? "No hay productos en este menú"
                    : "No products in this menu"
                  : language === "es"
                    ? "Selecciona un menú para ver sus productos"
                    : "Select a menu to view its products"}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedMenu || activeMenuId
                ? language === "es"
                  ? 'Usa el botón "Agregar Producto" para crear productos en este menú'
                  : 'Use the "Add Product" button to create products in this menu'
                : language === "es"
                  ? "Haz clic en un menú para ver y agregar productos"
                  : "Click on a menu to view and add products"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-[180px] group"
                style={{
                  backgroundImage: product.image_url
                    ? `url(${product.image_url})`
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                onClick={() => handleViewRecipe(product.id)}
              >
                {/* Dark overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

                {/* Active badge */}
                {product.active && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-green-600 text-white text-xs">
                      {t("active")}
                    </Badge>
                  </div>
                )}

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-3">
                  {/* Product info */}
                  <div className="mb-2">
                    <h4 className="font-bold text-white text-sm line-clamp-2 drop-shadow-lg">
                      {product.name}
                    </h4>
                    <p className="text-xs text-white/70">
                      {translateCategory(product.category)}
                    </p>
                    <p className="text-lg font-bold text-white drop-shadow-lg mt-1">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 bg-transparent border-2 border-white text-white hover:bg-white/20 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(product.id);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      {t("edit")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500/20 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(product.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {t("delete")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Ver Receta */}
        {viewingProduct && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingProduct(null)}
          >
            <Card
              className="neumorphic border-0 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {viewingProduct.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {viewingProduct.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewingProduct(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <Badge variant="outline" className="text-base">
                    {viewingProduct.category}
                  </Badge>
                  <span className="text-2xl font-bold text-primary">
                    ${viewingProduct.price.toFixed(2)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">
                      {t("ingredients")}:
                    </h3>
                    <div className="space-y-2">
                      {viewingProduct.ingredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 rounded-lg neumorphic-inset"
                        >
                          <span className="font-medium">{ing.name}</span>
                          <span className="text-muted-foreground">
                            {ing.quantity} {ing.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Agregar Producto */}
        {isAddingProduct && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsAddingProduct(false)}
          >
            <Card
              className="neumorphic border-0 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-2xl">
                    {language === "es"
                      ? "Diseñar Nuevo Producto"
                      : "Design New Product"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAddingProduct(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <CardDescription>
                  {language === "es"
                    ? "Crea un nuevo producto para tu menú"
                    : "Create a new product for your menu"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Image Upload Section */}
                  <div className="space-y-2">
                    <Label>
                      {language === "es"
                        ? "Imagen del Producto"
                        : "Product Image"}
                    </Label>
                    <div className="flex items-start gap-4">
                      {/* Preview */}
                      <div
                        className="relative w-28 h-28 rounded-xl bg-muted flex items-center justify-center overflow-hidden cursor-pointer group border-2 border-dashed border-border hover:border-primary transition-colors"
                        onClick={() =>
                          !isOptimizing && fileInputRef.current?.click()
                        }
                      >
                        {isOptimizing ? (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-xs">
                              {language === "es"
                                ? "Optimizando..."
                                : "Optimizing..."}
                            </span>
                          </div>
                        ) : imagePreview ? (
                          <>
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <ImageIcon className="h-6 w-6" />
                            <span className="text-xs">
                              {language === "es" ? "Sin imagen" : "No image"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isOptimizing}
                          className="neumorphic-hover border-0 gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {imagePreview
                            ? language === "es"
                              ? "Cambiar"
                              : "Change"
                            : language === "es"
                              ? "Subir"
                              : "Upload"}{" "}
                          {language === "es" ? "Imagen" : "Image"}
                        </Button>
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="neumorphic-hover border-0 gap-2 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                            {language === "es" ? "Eliminar" : "Remove"}
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {language === "es"
                            ? "Se optimiza automáticamente"
                            : "Automatically optimized"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name">{t("productName")} *</Label>
                      <Input
                        id="new-name"
                        placeholder={
                          language === "es"
                            ? "Ej: Mojito Clásico"
                            : "Ex: Classic Mojito"
                        }
                        value={newProduct.name}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-category">{t("category")} *</Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) =>
                          setNewProduct({ ...newProduct, category: value })
                        }
                      >
                        <SelectTrigger id="new-category">
                          <SelectValue
                            placeholder={
                              language === "es"
                                ? "Selecciona una categoría"
                                : "Select a category"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-price">{t("price")} *</Label>
                    <Input
                      id="new-price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newProduct.price || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-description">{t("description")}</Label>
                    <Input
                      id="new-description"
                      placeholder={
                        language === "es"
                          ? "Describe tu producto..."
                          : "Describe your product..."
                      }
                      value={newProduct.description || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t("ingredients")}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIngredientToNew}
                        className="neumorphic-hover border-0"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t("add")}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {newProduct.ingredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 p-2 rounded-lg neumorphic-inset"
                        >
                          <Input
                            placeholder={
                              language === "es" ? "Ingrediente" : "Ingredient"
                            }
                            value={ing.name}
                            onChange={(e) => {
                              const newIngredients = [
                                ...newProduct.ingredients,
                              ];
                              newIngredients[idx].name = e.target.value;
                              setNewProduct({
                                ...newProduct,
                                ingredients: newIngredients,
                              });
                            }}
                          />
                          <Input
                            type="number"
                            placeholder={
                              language === "es" ? "Cantidad" : "Quantity"
                            }
                            value={ing.quantity || ""}
                            onChange={(e) => {
                              const newIngredients = [
                                ...newProduct.ingredients,
                              ];
                              newIngredients[idx].quantity =
                                parseFloat(e.target.value) || 0;
                              setNewProduct({
                                ...newProduct,
                                ingredients: newIngredients,
                              });
                            }}
                          />
                          <Input
                            placeholder={language === "es" ? "Unidad" : "Unit"}
                            value={ing.unit}
                            onChange={(e) => {
                              const newIngredients = [
                                ...newProduct.ingredients,
                              ];
                              newIngredients[idx].unit = e.target.value;
                              setNewProduct({
                                ...newProduct,
                                ingredients: newIngredients,
                              });
                            }}
                          />
                          {newProduct.ingredients.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeIngredientFromNew(idx)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAddProduct}
                      className="flex-1"
                      disabled={
                        !newProduct.name ||
                        !newProduct.category ||
                        newProduct.price <= 0
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {language === "es" ? "Crear Producto" : "Create Product"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingProduct(false)}
                      className="flex-1"
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Editar Producto */}
        {editingProduct && editForm && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingProduct(null)}
          >
            <Card
              className="neumorphic border-0 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-2xl">{t("editProduct")}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingProduct(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Image Upload Section for Edit */}
                  <div className="space-y-2">
                    <Label>
                      {language === "es"
                        ? "Imagen del Producto"
                        : "Product Image"}
                    </Label>
                    <div className="flex items-start gap-4">
                      {/* Preview */}
                      <div
                        className="relative w-28 h-28 rounded-xl bg-muted flex items-center justify-center overflow-hidden cursor-pointer group border-2 border-dashed border-border hover:border-primary transition-colors"
                        onClick={() =>
                          !isEditOptimizing && editFileInputRef.current?.click()
                        }
                      >
                        {isEditOptimizing ? (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-xs">
                              {language === "es"
                                ? "Optimizando..."
                                : "Optimizing..."}
                            </span>
                          </div>
                        ) : editImagePreview || editForm.image_url ? (
                          <>
                            <img
                              src={editImagePreview || editForm.image_url || ""}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <ImageIcon className="h-6 w-6" />
                            <span className="text-xs">
                              {language === "es" ? "Sin imagen" : "No image"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-col gap-2">
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={isEditOptimizing}
                          className="neumorphic-hover border-0 gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {editImagePreview || editForm.image_url
                            ? language === "es"
                              ? "Cambiar"
                              : "Change"
                            : language === "es"
                              ? "Subir"
                              : "Upload"}{" "}
                          {language === "es" ? "Imagen" : "Image"}
                        </Button>
                        {(editImagePreview || editForm.image_url) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveEditImage}
                            className="neumorphic-hover border-0 gap-2 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                            {language === "es" ? "Eliminar" : "Remove"}
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {language === "es"
                            ? "Se optimiza automáticamente"
                            : "Automatically optimized"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("name")}</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">{t("category")}</Label>
                      <Select
                        value={editForm.category}
                        onValueChange={(value) =>
                          setEditForm({ ...editForm, category: value })
                        }
                      >
                        <SelectTrigger id="category">
                          <SelectValue
                            placeholder={
                              language === "es"
                                ? "Selecciona una categoría"
                                : "Select a category"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">{t("price")}</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          price: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t("description")}</Label>
                    <Input
                      id="description"
                      value={editForm.description || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t("ingredients")}</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newIngredients = [
                            ...editForm.ingredients,
                            { name: "", quantity: 0, unit: "" },
                          ];
                          setEditForm({
                            ...editForm,
                            ingredients: newIngredients,
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {language === "es"
                          ? "Agregar Ingrediente"
                          : "Add Ingredient"}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {editForm.ingredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 p-2 rounded-lg neumorphic-inset"
                        >
                          <Input
                            placeholder={
                              language === "es" ? "Ingrediente" : "Ingredient"
                            }
                            value={ing.name}
                            onChange={(e) => {
                              const newIngredients = [...editForm.ingredients];
                              newIngredients[idx].name = e.target.value;
                              setEditForm({
                                ...editForm,
                                ingredients: newIngredients,
                              });
                            }}
                          />
                          <Input
                            type="number"
                            placeholder={
                              language === "es" ? "Cantidad" : "Quantity"
                            }
                            value={isNaN(ing.quantity) ? "" : ing.quantity}
                            onChange={(e) => {
                              const newIngredients = [...editForm.ingredients];
                              newIngredients[idx].quantity =
                                parseFloat(e.target.value) || 0;
                              setEditForm({
                                ...editForm,
                                ingredients: newIngredients,
                              });
                            }}
                          />
                          <Input
                            placeholder={language === "es" ? "Unidad" : "Unit"}
                            value={ing.unit}
                            onChange={(e) => {
                              const newIngredients = [...editForm.ingredients];
                              newIngredients[idx].unit = e.target.value;
                              setEditForm({
                                ...editForm,
                                ingredients: newIngredients,
                              });
                            }}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const newIngredients =
                                editForm.ingredients.filter(
                                  (_, i) => i !== idx,
                                );
                              setEditForm({
                                ...editForm,
                                ingredients: newIngredients,
                              });
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveEdit} className="flex-1">
                      {language === "es" ? "Guardar Cambios" : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingProduct(null)}
                      className="flex-1"
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProdShell>
  );
}
