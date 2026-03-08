export const PAGE_DRAWER_ACTION_EVENT = 'lucid:page-drawer-action';

export interface PageDrawerActionDetail {
  page: string;
  action: string;
  value?: string;
}

export const emitPageDrawerAction = (detail: PageDrawerActionDetail) => {
  window.dispatchEvent(new CustomEvent<PageDrawerActionDetail>(PAGE_DRAWER_ACTION_EVENT, { detail }));
};

export const subscribePageDrawerActions = (
  listener: (detail: PageDrawerActionDetail) => void,
) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<PageDrawerActionDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(PAGE_DRAWER_ACTION_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(PAGE_DRAWER_ACTION_EVENT, handler as EventListener);
  };
};
