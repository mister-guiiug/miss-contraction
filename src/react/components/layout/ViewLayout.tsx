import type { ReactNode } from 'react';

interface ViewLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  lead?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  id?: string;
  dataTestId?: string;
}

export function ViewLayout({
  children,
  title,
  lead,
  footer,
  actions,
  className,
  headerClassName,
  contentClassName,
  id,
  dataTestId,
}: ViewLayoutProps) {
  const rootClassName = ['view', 'view-layout', className].filter(Boolean).join(' ');
  const headerClasses = ['view-layout__header', headerClassName]
    .filter(Boolean)
    .join(' ');
  const contentClasses = ['view-layout__content', contentClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <div id={id} className={rootClassName} data-testid={dataTestId}>
      {(title || lead) && (
        <header className={headerClasses}>
          {title ? <h2 className="view-layout__title">{title}</h2> : null}
          {lead ? <div className="subtitle view-layout__lead">{lead}</div> : null}
        </header>
      )}

      <div className={contentClasses}>{children}</div>

      {actions ? <div className="view-layout__actions">{actions}</div> : null}
      {footer ? <div className="view-layout__footer">{footer}</div> : null}
    </div>
  );
}