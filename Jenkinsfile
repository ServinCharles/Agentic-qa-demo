pipeline {
    agent any
    tools {
        nodejs 'NodeJS'
    }

    parameters {
        choice(
            name: 'TEST_SUITE',
            choices: ['smoke', 'regression', 'api', 'events', 'lighthouse', 'all'],
            description: 'Test suite to run. events = application saved (MongoDB) and decision audited (Kafka); needs persistence on, so mock or sit-01. lighthouse = page performance budgets (use against the real web app, e.g. sit-01). all = smoke, regression and api'
        )
        choice(
            name: 'ENVIRONMENT',
            choices: ['mock', 'sit-01', 'sit-02'],
            description: 'Where to run the tests. mock = local mock server. sit-01 / sit-02 use the SIT_01_URL / SIT_02_URL Jenkins variables'
        )
        string(
            name: 'BASE_URL',
            defaultValue: '',
            description: 'Optional: override the environment URL, e.g. http://localhost:8090 for a port-forward. Set by the AIP Deployment Pipeline'
        )
        string(
            name: 'AUDIT_URL',
            defaultValue: '',
            description: 'events suite only: aip-audit-service URL. Empty = BASE_URL for mock, http://localhost:8091 for sit-01/sit-02 (kubectl -n sit-01-api port-forward svc/aip-audit-service 8091:8080)'
        )
        choice(
            name: 'BROWSER',
            choices: ['local', 'browserstack'],
            description: 'Browser environment'
        )
        booleanParam(
            name: 'USE_DOCKER',
            defaultValue: false,
            description: 'Run the tests inside the Docker image built from ./Dockerfile'
        )
    }

    environment {
        // Tests read BASE_URL: the override if given, otherwise the chosen environment's URL
        BASE_URL = "${resolveBaseUrl()}"
        AUDIT_URL = "${resolveAuditUrl()}"
        PATH = "/Applications/Docker.app/Contents/Resources/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

        // BrowserStack credentials from Jenkins credential store
        BROWSERSTACK_USER = credentials('browserstack-user')
        BROWSERSTACK_KEY = credentials('browserstack-key')
        BROWSERSTACK_LOCAL_IDENTIFIER = "jenkins-${BUILD_NUMBER}"
        
        // Test reporting
        REPORTS_DIR = "${WORKSPACE}/reports"
        LOGS_DIR = "${WORKSPACE}/logs"
    }

    stages {
        stage('Resolve Environment') {
            steps {
                script {
                    if (env.BASE_URL == 'MISSING') {
                        def variable = params.ENVIRONMENT.toUpperCase().replace('-', '_') + '_URL'
                        error "No URL for ${params.ENVIRONMENT}. Add ${variable} under Manage Jenkins → System → Global properties → Environment variables, or pass BASE_URL"
                    }
                    currentBuild.displayName = "#${env.BUILD_NUMBER} ${params.TEST_SUITE} on ${params.ENVIRONMENT}"
                    echo "🎯 Testing ${params.ENVIRONMENT} at ${env.BASE_URL}"
                }
                // Fail fast with a clear message if the app isn't reachable (e.g. port-forward not running)
                sh '''
                    if [ "$ENVIRONMENT" != "mock" ] && ! curl -s -o /dev/null --max-time 10 "$BASE_URL/"; then
                        echo "❌ Cannot reach $BASE_URL for $ENVIRONMENT."
                        echo "   For a local cluster, start the port-forward first:"
                        echo "   kubectl -n $ENVIRONMENT-dip port-forward svc/aip-webapp 8090:80"
                        exit 1
                    fi
                '''
                // Shown on the Allure report's Environment panel
                sh '''
                    mkdir -p allure-results
                    printf 'Environment=%s\nBase.URL=%s\nSuite=%s\nBrowser=%s\n' "$ENVIRONMENT" "$BASE_URL" "$TEST_SUITE" "$BROWSER" > allure-results/environment.properties
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing npm dependencies...'
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                echo '🔍 Linting features and page objects...'
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Start Mock Server') {
            when {
                expression { !params.USE_DOCKER && params.ENVIRONMENT == 'mock' && !params.BASE_URL?.trim() }
            }
            steps {
                echo '🚀 Starting mock server on port 3000...'
                sh 'mkdir -p logs'
                sh 'nohup node mock-server.js > logs/mock-server.log 2>&1 &'
                sh 'sleep 3'
                sh 'curl -s http://localhost:3000 || curl -s http://localhost:3000/health || echo "Mock server started"'
            }
        }

        stage('Run API Tests') {
            when {
                expression { params.TEST_SUITE == 'api' || params.TEST_SUITE == 'all' }
            }
            steps {
                echo '🔌 Running API test suite...'
                script {
                    if (params.USE_DOCKER) {
                        runInDocker('npm run test:api')
                    } else {
                        sh 'npm run test:api'
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/api-tests.html', allowEmptyArchive: true
                }
            }
        }

        stage('Run Events Tests') {
            when {
                expression { params.TEST_SUITE == 'events' }
            }
            steps {
                echo "📨 Running events suite (app ${env.BASE_URL}, audit ${env.AUDIT_URL})..."
                // The audit service isn't public: on a local cluster it needs its own port-forward
                sh '''
                    if [ "$ENVIRONMENT" != "mock" ] && ! curl -s -o /dev/null --max-time 10 "$AUDIT_URL/health"; then
                        echo "❌ Cannot reach aip-audit-service at $AUDIT_URL."
                        echo "   For a local cluster, start its port-forward first:"
                        echo "   kubectl -n $ENVIRONMENT-api port-forward svc/aip-audit-service 8091:8080"
                        exit 1
                    fi
                '''
                script {
                    if (params.USE_DOCKER) {
                        runInDocker('npm run test:events')
                    } else {
                        sh 'npm run test:events'
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/events-tests.html', allowEmptyArchive: true
                }
            }
        }

        stage('Run Lighthouse') {
            when {
                expression { params.TEST_SUITE == 'lighthouse' }
            }
            steps {
                echo "🚦 Lighthouse page performance budgets on ${env.BASE_URL}..."
                // Uses the Chrome installed on the Jenkins machine (headless)
                sh 'npm run test:lighthouse'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/lighthouse/**', allowEmptyArchive: true
                }
            }
        }

        stage('Run Smoke Tests') {
            when {
                expression { params.TEST_SUITE == 'smoke' || params.TEST_SUITE == 'all' }
            }
            steps {
                echo '🔥 Running smoke test pack...'
                script {
                    if (params.USE_DOCKER) {
                        runInDocker('npm run test:smoke')
                    } else {
                        sh '''
                            if [ "${BROWSER}" = "browserstack" ]; then
                                BROWSERSTACK_USERNAME="${BROWSERSTACK_USER}" BROWSERSTACK_ACCESS_KEY="${BROWSERSTACK_KEY}" npm run test:bstack:smoke
                            else
                                npm run test:smoke
                            fi
                        '''
                    }
                }
            }
        }

        stage('Run Regression Tests') {
            when {
                expression { params.TEST_SUITE == 'regression' || params.TEST_SUITE == 'all' }
            }
            steps {
                echo '🔄 Running full regression test pack...'
                script {
                    if (params.USE_DOCKER) {
                        runInDocker('npm run test:regression')
                    } else {
                        sh '''
                            if [ "${BROWSER}" = "browserstack" ]; then
                                BROWSERSTACK_USERNAME="${BROWSERSTACK_USER}" BROWSERSTACK_ACCESS_KEY="${BROWSERSTACK_KEY}" npm run test:bstack:regression
                            else
                                npm run test:regression
                            fi
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            echo '📊 Collecting test results and logs...'
            
            // Capture logs if they exist
            sh 'mkdir -p "${REPORTS_DIR}" || true'
            sh 'cp -r logs/* "${REPORTS_DIR}/" 2>/dev/null || true'
            
            // Archive test reports
            archiveArtifacts artifacts: 'logs/**', allowEmptyArchive: true
            
            // Publish JUnit results if available
            junit testResults: '**/reports/**/*.xml', allowEmptyResults: true

            // Archive Allure results
            archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true

            // The api and events features (Cucumber) write JUnit XML (Allure reads it); the UI features write Allure results directly
            sh 'mkdir -p allure-results && cp reports/*.xml allure-results/ 2>/dev/null || true'

            // Generate the HTML report that publishHTML serves
            sh 'npx allure generate allure-results --clean -o allure-report || true'
            
            // Publish Allure report
            publishHTML([
                 allowMissing: true,
                 alwaysLinkToLastBuild: true,
                 keepAll: true,
                 reportDir: 'allure-report',
                 reportFiles: 'index.html',
                 reportName: 'Allure Report'
            ])
            
        }

        success {
            echo '✅ Test execution completed successfully'
            // Optional: Send success notification to Slack/Teams
        }

        failure {
            echo '❌ Test execution failed'
            // Optional: Send failure notification with details
        }

        cleanup {
            echo '🧹 Cleaning up...'
            sh 'pkill -f "node mock-server.js" || true'
            deleteDir()
        }
    }
}

// Builds the test image and runs a command in it, with the mock server started inside the container
def runInDocker(String testCommand) {
    sh '''
        export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
        command -v docker-credential-desktop
        mkdir -p logs
        docker build -t agentic-qa-demo:${BUILD_NUMBER} .
    '''
    sh "docker run --rm -v \"\${WORKSPACE}\":/app -v /app/node_modules agentic-qa-demo:\${BUILD_NUMBER} sh -c 'npm ci && (node mock-server.js > logs/mock-server.log 2>&1 &) && sleep 3 && ${testCommand}'"
}

// AUDIT_URL for the events suite: an explicit override wins; the mock serves the audit API itself;
// SIT environments use SIT_0X_AUDIT_URL if set, otherwise the usual port-forward on 8091
def resolveAuditUrl() {
    if (params.AUDIT_URL?.trim()) {
        return params.AUDIT_URL.trim()
    }
    switch (params.ENVIRONMENT) {
        case 'sit-01': return env.SIT_01_AUDIT_URL?.trim() ?: 'http://localhost:8091'
        case 'sit-02': return env.SIT_02_AUDIT_URL?.trim() ?: 'http://localhost:8091'
        default:       return resolveBaseUrl()
    }
}

// BASE_URL for the run: an explicit override wins, then the environment's Jenkins variable.
// Returns 'MISSING' so the Resolve Environment stage can fail with a clear message.
def resolveBaseUrl() {
    if (params.BASE_URL?.trim()) {
        return params.BASE_URL.trim()
    }
    switch (params.ENVIRONMENT) {
        case 'sit-01': return env.SIT_01_URL?.trim() ?: 'MISSING'
        case 'sit-02': return env.SIT_02_URL?.trim() ?: 'MISSING'
        default:       return 'http://localhost:3000'
    }
}