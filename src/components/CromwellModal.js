import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, spinnerOverlay } from 'src/components/common'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { tools } from 'src/components/notebook-utils'
import TitleBar from 'src/components/TitleBar'
import { Ajax } from 'src/libs/ajax'
import { withErrorReportingInModal } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { computeStyles, getCurrentApp, getCurrentPersistentDisk } from 'src/libs/runtime-utils'
import * as Utils from 'src/libs/utils'


const defaultDataDiskSize = 500 // GB
const defaultKubernetesRuntimeConfig = { machineType: 'n1-highmem-8', numNodes: 1, autoscalingEnabled: false }

const titleId = 'cromwell-modal-title'

// TODO: As this code continues to evolve, create a shared base class with GalaxyModalBase if possible
// (or find another way to reduce code duplication).
export const CromwellModalBase = Utils.withDisplayName('CromwellModal')(
  ({
    onDismiss, onSuccess, apps, appDataDisks, workspace, workspace: { workspace: { namespace, bucketName, name: workspaceName, googleProject } },
    isAnalysisMode = false
  }) => {
    const app = getCurrentApp(tools.cromwell.appType)(apps)
    const [loading, setLoading] = useState(false)
    const currentDataDisk = getCurrentPersistentDisk(tools.cromwell.appType, apps, appDataDisks)

    const createCromwell = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReportingInModal('Error creating Cromwell', onDismiss)
    )(async () => {
      await Ajax().Apps.app(googleProject, Utils.generateAppName()).create({
        defaultKubernetesRuntimeConfig, diskName: !!currentDataDisk ? currentDataDisk.name : Utils.generatePersistentDiskName(), diskSize: defaultDataDiskSize,
        appType: tools.cromwell.appType, namespace, bucketName, workspaceName
      })
      Ajax().Metrics.captureEvent(Events.applicationCreate, { app: tools.cromwell.appType, ...extractWorkspaceDetails(workspace) })
      return onSuccess()
    })

    const renderActionButton = () => {
      return !app ? h(ButtonPrimary, { onClick: createCromwell }, ['Create']) :
        h(ButtonPrimary, { onClick: onDismiss }, ['Close'])
    }

    const getEnvMessageBasedOnStatus = app => {
      const waitMessage = 'This process will take up to a few minutes.'
      const nonStatusSpecificMessage = 'Create a Cromwell environment to run workflows in your current workspace?'

      return !app ?
        nonStatusSpecificMessage :
        Utils.switchCase(app.status,
          ['PROVISIONING', () => `The cloud compute is provisioning, which may take several minutes.`],
          ['STOPPED', () => `The cloud compute is paused.`],
          ['PRESTOPPING', () => 'The cloud compute is preparing to pause.'],
          ['STOPPING', () => `The cloud compute is pausing. ${waitMessage}`],
          ['PRESTARTING', () => 'The cloud compute is preparing to resume.'],
          ['STARTING', () => `The cloud compute is resuming. ${waitMessage}`],
          ['RUNNING', () => `There is already an instance of Cromwell running.`],
          ['ERROR', () => `An error has occurred on your cloud environment.`]
        )
    }

    const renderDefaultCase = () => {
      return div({ style: computeStyles.drawerContent }, [
        h(TitleBar, {
          id: titleId,
          title: 'Cromwell Cloud Environment',
          hideCloseButton: isAnalysisMode,
          style: { marginBottom: '0.5rem' },
          onDismiss,
          onPrevious: undefined
        }),
        div([
          getEnvMessageBasedOnStatus(app)
        ]),
        div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [
          renderActionButton()
        ])
      ])
    }
    return h(Fragment, [renderDefaultCase(), loading && spinnerOverlay])
  }
)

export const CromwellModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(CromwellModalBase)