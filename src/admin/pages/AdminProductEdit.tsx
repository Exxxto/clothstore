import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetProduct, DBProduct } from "../api";
import ProductForm from "../components/ProductForm";
import { ArrowLeft } from "lucide-react";
import { getGenderLabel, normalizeGenderValue } from "@/lib/productNormalization";

const GENDER_LABELS: Record<string, string> = {
  men: "Мужские товары",
  women: "Женские товары",
  kids: "Детские товары",
};

export default function AdminProductEdit() {
  const { id, gender: genderSlug } = useParams<{ id: string; gender?: string }>();
  const genderFilter = normalizeGenderValue(genderSlug);
  const backPath = genderSlug ? `/admin/products/${genderSlug}` : "/admin/products";
  const sectionLabel = genderFilter ? GENDER_LABELS[genderFilter] : genderSlug ? `${getGenderLabel(genderSlug)} товары` : "Все товары";

  const [product, setProduct] = useState<DBProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    apiGetProduct(parseInt(id))
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-4 max-w-3xl">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8">
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error || "Товар не найден"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {sectionLabel}
        </Link>
        <h1 className="text-2xl font-bold text-white">Редактировать товар</h1>
        <p className="text-gray-400 mt-1 text-sm">#{product.id} — {product.name}</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <ProductForm product={product} backPath={backPath} />
      </div>
    </div>
  );
}
