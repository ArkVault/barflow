"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from 'lucide-react';
import { EditProductDialog } from "./edit-product-dialog";
import { DeleteProductDialog } from "./delete-product-dialog";
import { ViewRecipeDialog } from "./view-recipe-dialog";
import type { Supply, ProductIngredient, Product } from "@/types";
import { formatCurrency } from '@/lib/format';

interface ProductsTableProps {
  products: Product[];
  supplies: Supply[];
}

export function ProductsTable({ products: initialProducts, supplies }: ProductsTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleProductDeleted = (deletedId: string) => {
    setProducts(prev => prev.filter(p => p.id !== deletedId));
  };

  if (products.length === 0) {
    return (
      <Card className="neumorphic border-0">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No hay productos registrados</p>
          <p className="text-sm text-muted-foreground">
            Comienza agregando tu primer producto o bebida usando el botón superior
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="neumorphic border-0">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2 text-balance">{product.name}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    {product.category && (
                      <Badge variant="secondary" className="capitalize">
                        {product.category}
                      </Badge>
                    )}
                    <Badge variant={product.is_active ? "default" : "outline"}>
                      {product.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {product.product_ingredients?.length ?? 0} ingredientes
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingProduct(product)}
                    className="neumorphic-hover border-0 flex-1 gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Receta
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingProduct(product)}
                    className="neumorphic-hover h-9 w-9"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingProduct(product)}
                    className="neumorphic-hover h-9 w-9 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          supplies={supplies}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {deletingProduct && (
        <DeleteProductDialog
          product={deletingProduct}
          open={!!deletingProduct}
          onOpenChange={(open) => !open && setDeletingProduct(null)}
          onProductDeleted={handleProductDeleted}
        />
      )}

      {viewingProduct && (
        <ViewRecipeDialog
          product={viewingProduct}
          open={!!viewingProduct}
          onOpenChange={(open) => !open && setViewingProduct(null)}
        />
      )}
    </>
  );
}
