import { IconAlertTriangle } from "@tabler/icons-react";
import React from "react";
import "~/styles/components/AccordionGroup.scss";

interface AccordionGroupProps {
  title: string;
  icon?: React.ReactNode;
  warningText?: string;
  children: React.ReactNode;
}

export function AccordionGroup({
  title,
  icon,
  warningText,
  children
}: AccordionGroupProps) {
  return (
    <div className="accordion-group">
      <div className="accordion-header">
        <div className="accordion-title">
          <span className="title-content">
            {icon && <span className="icon-wrapper">{icon}</span>}
            {title}
          </span>
          {warningText && (
            <span className="warning-text">
              <IconAlertTriangle
                size={16}
                className="warning-icon"
                stroke={1.5}
              />
              {warningText}
            </span>
          )}
        </div>
      </div>
      <div className="accordion-content">{children}</div>
    </div>
  );
}
