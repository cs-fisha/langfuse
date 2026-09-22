/* eslint-disable boundaries/dependencies */
import { type CellContext, type RowData } from "@tanstack/react-table";
import { Check, Copy, type LucideIcon } from "lucide-react";

import { IconButton } from "@/src/components/design-system/IconButton/IconButton";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCopyToClipboard } from "@/src/hooks/useCopyToClipboard";
import {
  createTableColumn,
  type TableColumnOptions,
} from "./utils/createTableColumn";

type TextValueMapper<TData extends RowData, TValue> = (
  value: TValue | null | undefined,
  context: CellContext<TData, TValue | null | undefined>,
) => string | { type: "loading" } | undefined;

type TextTableColumnOptions<TData extends RowData, TValue> = TableColumnOptions<
  TData,
  TValue
> &
  ([TValue] extends [string]
    ? { mapValue?: TextValueMapper<TData, TValue> }
    : { mapValue: TextValueMapper<TData, TValue> });

type TextTableColumnTrailingAction<TData extends RowData, TValue> =
  | {
      type: "copy-to-clipboard";
    }
  | {
      type: "custom";
      icon: LucideIcon;
      label: string;
      onClick: (context: CellContext<TData, TValue>) => void;
    };

export function createTextTableColumn<TData extends RowData, TValue = string>({
  mapValue,
  nullValue,
  trailingAction,
  ...options
}: TextTableColumnOptions<TData, TValue> & {
  nullValue?: string;
  trailingAction?: TextTableColumnTrailingAction<TData, TValue>;
}) {
  const loadingCell = <Skeleton className="h-4 w-1/2" />;

  return createTableColumn<TData, TValue>({
    ...options,
    loadingCell,
    renderCell: (value, context) => {
      const text = mapValue ? mapValue(value, context) : value;

      if (text === null || text === undefined) {
        if (!trailingAction)
          return nullValue ? <Text value={nullValue} /> : null;
        if (trailingAction.type === "copy-to-clipboard") {
          return nullValue ? <CopyableText value={nullValue} /> : null;
        }

        return (
          <TextWithTrailingAction
            value={nullValue}
            action={trailingAction}
            context={context}
          />
        );
      }
      if (typeof text !== "string") return loadingCell;

      if (trailingAction?.type === "copy-to-clipboard") {
        return <CopyableText value={text} />;
      }
      if (trailingAction?.type === "custom") {
        return (
          <TextWithTrailingAction
            value={text}
            action={trailingAction}
            context={context}
          />
        );
      }

      return <Text value={text} />;
    },
  });
}

function TextWithTrailingAction<TData extends RowData, TValue>({
  action,
  context,
  value,
}: {
  action: Extract<
    TextTableColumnTrailingAction<TData, TValue>,
    { type: "custom" }
  >;
  context: CellContext<TData, TValue>;
  value?: string;
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      {value ? (
        <span className="min-w-0 truncate" title={value}>
          {value}
        </span>
      ) : null}
      <IconButton
        icon={action.icon}
        label={action.label}
        size="xs"
        onClick={() => action.onClick(context)}
      />
    </div>
  );
}

function Text({ value }: { value: string }) {
  return (
    <span className="block w-full truncate" title={value}>
      {value}
    </span>
  );
}

function CopyableText({ value }: { value: string }) {
  const { copy, isCopied } = useCopyToClipboard();

  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      <span className="min-w-0 truncate" title={value}>
        {value}
      </span>
      <IconButton
        icon={isCopied ? Check : Copy}
        label={isCopied ? "Copied" : "Copy to clipboard"}
        size="xs"
        title="Copy to clipboard"
        onClick={async () => {
          try {
            await copy(value);
          } catch {
            // Clipboard failures are intentionally silent.
          }
        }}
      />
    </div>
  );
}
