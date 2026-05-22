import { ReactNode } from "react";

interface IAppShellProps {
  children: ReactNode | ReactNode[];
}

export function AppShell(props: IAppShellProps) {
  return <div>{props.children}</div>;
}
