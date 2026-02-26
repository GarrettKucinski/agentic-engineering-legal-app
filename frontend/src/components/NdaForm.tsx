"use client";

import { NdaFormData } from "@/lib/types";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

export default function NdaForm({ data, onChange }: NdaFormProps) {
  function update(fields: Partial<NdaFormData>) {
    onChange({ ...data, ...fields });
  }

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900">
          Agreement Details
        </legend>

        <div>
          <label
            htmlFor="purpose"
            className="block text-sm font-medium text-gray-700"
          >
            Purpose
          </label>
          <p className="text-xs text-gray-500 mb-1">
            How Confidential Information may be used
          </p>
          <textarea
            id="purpose"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={data.purpose}
            onChange={(e) => update({ purpose: e.target.value })}
          />
        </div>

        <div>
          <label
            htmlFor="effectiveDate"
            className="block text-sm font-medium text-gray-700"
          >
            Effective Date
          </label>
          <input
            id="effectiveDate"
            type="date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={data.effectiveDate}
            onChange={(e) => update({ effectiveDate: e.target.value })}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900">
          Term Options
        </legend>

        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            MNDA Term
          </span>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="mndaTermType"
                value="expires"
                checked={data.mndaTermType === "expires"}
                onChange={() => update({ mndaTermType: "expires" })}
                className="text-blue-600"
              />
              Expires after
              <input
                type="number"
                min={1}
                max={10}
                className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
                value={data.mndaTermYears}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) update({ mndaTermYears: val });
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (isNaN(val) || val < 1) update({ mndaTermYears: 1 });
                  else if (val > 10) update({ mndaTermYears: 10 });
                }}
                disabled={data.mndaTermType !== "expires"}
              />
              year(s) from Effective Date
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="mndaTermType"
                value="untilTerminated"
                checked={data.mndaTermType === "untilTerminated"}
                onChange={() => update({ mndaTermType: "untilTerminated" })}
                className="text-blue-600"
              />
              Continues until terminated
            </label>
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Term of Confidentiality
          </span>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="confidentialityTermType"
                value="duration"
                checked={data.confidentialityTermType === "duration"}
                onChange={() =>
                  update({ confidentialityTermType: "duration" })
                }
                className="text-blue-600"
              />
              <input
                type="number"
                min={1}
                max={10}
                className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
                value={data.confidentialityTermYears}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val))
                    update({ confidentialityTermYears: val });
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (isNaN(val) || val < 1)
                    update({ confidentialityTermYears: 1 });
                  else if (val > 10)
                    update({ confidentialityTermYears: 10 });
                }}
                disabled={data.confidentialityTermType !== "duration"}
              />
              year(s) from Effective Date
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="confidentialityTermType"
                value="perpetuity"
                checked={data.confidentialityTermType === "perpetuity"}
                onChange={() =>
                  update({ confidentialityTermType: "perpetuity" })
                }
                className="text-blue-600"
              />
              In perpetuity
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900">
          Governing Law & Jurisdiction
        </legend>

        <div>
          <label
            htmlFor="governingLaw"
            className="block text-sm font-medium text-gray-700"
          >
            Governing Law
          </label>
          <p className="text-xs text-gray-500 mb-1">State name</p>
          <input
            id="governingLaw"
            type="text"
            placeholder="e.g., Delaware"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={data.governingLaw}
            onChange={(e) => update({ governingLaw: e.target.value })}
          />
        </div>

        <div>
          <label
            htmlFor="jurisdiction"
            className="block text-sm font-medium text-gray-700"
          >
            Jurisdiction
          </label>
          <p className="text-xs text-gray-500 mb-1">City or county and state</p>
          <input
            id="jurisdiction"
            type="text"
            placeholder='e.g., "courts located in New Castle, DE"'
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={data.jurisdiction}
            onChange={(e) => update({ jurisdiction: e.target.value })}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900">
          Modifications
        </legend>
        <div>
          <label
            htmlFor="modifications"
            className="block text-sm font-medium text-gray-700"
          >
            MNDA Modifications
          </label>
          <p className="text-xs text-gray-500 mb-1">
            List any modifications to the MNDA
          </p>
          <textarea
            id="modifications"
            rows={3}
            placeholder="None"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={data.modifications}
            onChange={(e) => update({ modifications: e.target.value })}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900">Party 1</legend>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="party1Name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="party1Name"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.party1Name}
              onChange={(e) => update({ party1Name: e.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="party1Title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              id="party1Title"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.party1Title}
              onChange={(e) => update({ party1Title: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="party1Company"
            className="block text-sm font-medium text-gray-700"
          >
            Company
          </label>
          <input
            id="party1Company"
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={data.party1Company}
            onChange={(e) => update({ party1Company: e.target.value })}
          />
        </div>

        <div>
          <label
            htmlFor="party1Address"
            className="block text-sm font-medium text-gray-700"
          >
            Notice Address
          </label>
          <p className="text-xs text-gray-500 mb-1">Email or postal address</p>
          <input
            id="party1Address"
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={data.party1Address}
            onChange={(e) => update({ party1Address: e.target.value })}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900">Party 2</legend>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="party2Name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="party2Name"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.party2Name}
              onChange={(e) => update({ party2Name: e.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="party2Title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              id="party2Title"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={data.party2Title}
              onChange={(e) => update({ party2Title: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="party2Company"
            className="block text-sm font-medium text-gray-700"
          >
            Company
          </label>
          <input
            id="party2Company"
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={data.party2Company}
            onChange={(e) => update({ party2Company: e.target.value })}
          />
        </div>

        <div>
          <label
            htmlFor="party2Address"
            className="block text-sm font-medium text-gray-700"
          >
            Notice Address
          </label>
          <p className="text-xs text-gray-500 mb-1">Email or postal address</p>
          <input
            id="party2Address"
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={data.party2Address}
            onChange={(e) => update({ party2Address: e.target.value })}
          />
        </div>
      </fieldset>
    </form>
  );
}
