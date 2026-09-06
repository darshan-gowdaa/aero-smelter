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
    <Card className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <RiShieldCheckLine className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Cryptographic PII Protection & India DPDP Compliance
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.field}</span>
              <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                {item.protection}
              </span>
            </div>
            <p className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate">{item.format}</p>
            <p className="text-[10px] text-slate-400">{item.status}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
