interface CategoryHeaderProps {
  category: string;
}

const CategoryHeader = ({ category }: CategoryHeaderProps) => {
  return (
    <section className="w-full px-2 md:px-3 mb-4">
      <h1 className="text-2xl md:text-3xl font-light text-foreground">
        {category}
      </h1>
    </section>
  );
};

export default CategoryHeader;
