import { useParams, Link } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { ArrowLeft } from "lucide-react";
import { getGenderLabel, normalizeGenderValue } from "@/lib/productNormalization";

const GENDER_LABELS: Record<string, string> = {
  men: "Мужские товары",
  women: "Женские товары",
  kids: "Детские товары",
};

export default function AdminProductCreate() {
  const { gender: genderSlug } = useParams<{ gender?: string }>();
  const genderFilter = normalizeGenderValue(genderSlug);
  const backPath = genderSlug ? `/admin/products/${genderSlug}` : "/admin/products";
  const sectionLabel = genderFilter ? GENDER_LABELS[genderFilter] : genderSlug ? `${getGenderLabel(genderSlug)} товары` : "Все товары";

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {sectionLabel}
        </Link>
        <h1 className="text-2xl font-bold text-white">Новый товар</h1>
        <p className="text-gray-400 mt-1 text-sm">Заполните данные нового товара</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <ProductForm backPath={backPath} />
      </div>
    </div>
  );
}
