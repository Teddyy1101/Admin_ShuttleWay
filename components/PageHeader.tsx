import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
}

export default function PageHeader({ title, breadcrumbs }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1.5">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <div key={crumb.label} className="flex items-center">
              {crumb.href && !isLast ? (
                <Link 
                  href={crumb.href} 
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? "text-blue-800 dark:text-blue-200 font-medium" : ""}>
                  {crumb.label}
                </span>
              )}
              
              {!isLast && (
                <span className="mx-2 text-gray-400 dark:text-gray-600">/</span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
