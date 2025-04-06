import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useParams } from "react-router";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { useDeleteConversation } from "#/hooks/mutation/use-delete-conversation";
import { useUpdateConversation } from "#/hooks/mutation/use-update-conversation";
import { useUserConversations } from "#/hooks/query/use-user-conversations";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useEndSession } from "#/hooks/use-end-session";
import { I18nKey } from "#/i18n/declaration";
import { ConfirmDeleteModal } from "./confirm-delete-modal";
import { ConversationCard } from "./conversation-card";
import { ExitConversationModal } from "./exit-conversation-modal";

interface ConversationPanelProps {
  onClose: () => void;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement | undefined>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement | undefined>;
}

export function ConversationPanel({
  onClose,
  onMouseEnter,
  onMouseLeave,
}: ConversationPanelProps) {
  const { t } = useTranslation();
  const { conversationId: cid } = useParams();
  const endSession = useEndSession();
  const ref = useClickOutsideElement<HTMLDivElement>(onClose);

  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] =
    React.useState(false);
  const [
    confirmExitConversationModalVisible,
    setConfirmExitConversationModalVisible,
  ] = React.useState(false);
  const [selectedConversationId, setSelectedConversationId] = React.useState<
    string | null
  >(null);

  const { data: conversations, isFetching, error } = useUserConversations();

  const { mutate: deleteConversation } = useDeleteConversation();
  const { mutate: updateConversation } = useUpdateConversation();

  const handleDeleteProject = (conversationId: string) => {
    setConfirmDeleteModalVisible(true);
    setSelectedConversationId(conversationId);
  };

  const handleConfirmDelete = () => {
    if (selectedConversationId) {
      deleteConversation(
        { conversationId: selectedConversationId },
        {
          onSuccess: () => {
            if (cid === selectedConversationId) {
              endSession();
            }
          },
        },
      );
    }
  };

  const handleChangeTitle = (
    conversationId: string,
    oldTitle: string,
    newTitle: string,
  ) => {
    if (oldTitle !== newTitle)
      updateConversation({
        id: conversationId,
        conversation: { title: newTitle },
      });
  };

  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="absolute w-[350px] h-full left-[-20px]" />
      <div
        ref={ref}
        data-testid="conversation-panel"
        className="w-[350px] h-full border border-neutral-700 bg-base-secondary dark:bg-base-secondary-dark rounded-xl overflow-y-auto absolute"
      >
        {isFetching && (
          <div className="w-full h-full absolute flex justify-center items-center">
            <LoadingSpinner size="small" />
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-danger">{error.message}</p>
          </div>
        )}
        {conversations?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-neutral-400">
              {t(I18nKey.CONVERSATION$NO_CONVERSATIONS)}
            </p>
          </div>
        )}
        {conversations?.map((project) => (
          <NavLink
            key={project.conversation_id}
            to={`/conversations/${project.conversation_id}`}
            onClick={onClose}
          >
            {({ isActive }) => (
              <ConversationCard
                isActive={isActive}
                onDelete={() => handleDeleteProject(project.conversation_id)}
                onChangeTitle={(title) =>
                  handleChangeTitle(
                    project.conversation_id,
                    project.title,
                    title,
                  )
                }
                title={project.title}
                selectedRepository={project.selected_repository}
                lastUpdatedAt={project.last_updated_at}
                status={project.status}
              />
            )}
          </NavLink>
        ))}

        {confirmDeleteModalVisible && (
          <ConfirmDeleteModal
            onConfirm={() => {
              handleConfirmDelete();
              setConfirmDeleteModalVisible(false);
            }}
            onCancel={() => setConfirmDeleteModalVisible(false)}
          />
        )}

        {confirmExitConversationModalVisible && (
          <ExitConversationModal
            onConfirm={() => {
              endSession();
              onClose();
            }}
            onClose={() => setConfirmExitConversationModalVisible(false)}
          />
        )}
      </div>
    </div>
  );
}
