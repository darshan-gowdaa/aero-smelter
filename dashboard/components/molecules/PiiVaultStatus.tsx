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
    <Card glow="emerald" className="border-emerald-900/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
            <RiShieldCheckLine className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm">
              Cryptographic PII Protection & India DPDP Compliance
            </h4>
            <p className="text-xs text-slate-400">
              Zero raw personally identifiable information exposed in analytics or Power BI layers
            </p>
          </div>
        </div>
        <Badge variant="success" size="sm">
          <RiLockPasswordLine className="w-3.5 h-3.5" />
          Vault Secured
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {piiFields.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">{item.field}</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/40">
                {item.protection}
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-400 truncate">{item.format}</p>
            <p className="text-[10px] text-slate-500">{item.status}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
