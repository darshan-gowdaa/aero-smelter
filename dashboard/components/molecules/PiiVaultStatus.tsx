import React from "react";
import { Card } from "@/components/atoms/Card";
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
    <Card className="border-2 border-emerald-200/80 dark:border-emerald-800/50">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-200 dark:border-emerald-700/60 shadow-md">
            <RiShieldCheckLine className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-emerald-950 dark:text-emerald-50 text-base">
              Cryptographic PII Protection & India DPDP Compliance
            </h4>
            <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70 font-medium">
              Zero raw personally identifiable information exposed in analytics or Power BI layers
            </p>
          </div>
        </div>
        <Badge variant="success" size="md">
          <RiLockPasswordLine className="w-3.5 h-3.5" />
          Vault Secured
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {piiFields.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-900/30 border-2 border-emerald-100 dark:border-emerald-800/50 space-y-1.5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100">{item.field}</span>
              <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300/60 dark:border-emerald-700/60">
                {item.protection}
              </span>
            </div>
            <p className="font-mono text-xs text-emerald-800 dark:text-emerald-300 truncate">{item.format}</p>
            <p className="text-[10px] text-emerald-700/60 dark:text-emerald-400/60 font-medium">{item.status}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
