import React from "react";
import { Badge } from "@/components/atoms/Badge";
import { RiShieldCheckLine, RiLockPasswordLine } from "@remixicon/react";

export function PiiVaultStatus() {
  const piiFields = [
    { field: "Aadhaar Number", protection: "SHA-256 + Salt", format: "XXXX-XXXX-4920", status: "Masked & Isolated" },
    { field: "Passport Number", protection: "SHA-256 + Salt", format: "Z******92", status: "Masked & Isolated" },
    { field: "Primary Phone", protection: "SHA-256 + Salt", format: "+91-XXXXX-XX82", status: "Masked & Isolated" },
    { field: "Email Address", protection: "Domain Retained", format: "us**@domain.com", status: "Masked for Cohorts" },
    { field: "Emergency Contact", protection: "SHA-256 Hash", format: "Irreversible Hash", status: "Anonymized" },
    { field: "Secure Vault File", protection: "Restricted Parquet", format: "data/secure/pii_vault.parquet", status: "Access Controlled" },
  ];

  return (
    <div className="clay p-6 sm:p-7 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-variant)] border border-emerald-300/60 dark:border-emerald-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[var(--radius-md)] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <RiShieldCheckLine className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-[var(--color-on-surface)] text-sm">
              Cryptographic PII Protection & India DPDP Compliance
            </h4>
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Zero raw personally identifiable information exposed in analytics or Power BI layers
            </p>
          </div>
        </div>
        <Badge variant="success" size="md">
          <RiLockPasswordLine className="w-3.5 h-3.5" />
          Vault Secured
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {piiFields.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-surface-variant)] space-y-1 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-on-surface)]">{item.field}</span>
              <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-[var(--radius-full)] border border-emerald-300 dark:border-emerald-800">
                {item.protection}
              </span>
            </div>
            <p className="font-mono text-xs text-[var(--color-on-surface-variant)] truncate">{item.format}</p>
            <p className="text-[10px] text-[var(--color-on-surface-variant)]/70">{item.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
