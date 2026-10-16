pipeline {
    agent any
    tools {
        nodejs 'NodeJS'
    }

    parameters {
        choice(
            name: 'TEST_SUITE',
            choices: ['smoke', 'regression', 'api', 'all'],
            description: 'Test suite to run'
        )
        string(
            name: 'BASE_URL',
            defaultValue: '',
            description: 'App under test, e.g. http://<load balancer> (set by the AIP Deployment Pipeline). Empty = local mock server'
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
        // Tests read BASE_URL; empty means the local mock server on port 3000
        BASE_URL = "${params.BASE_URL?.trim() ?: 'http://localhost:3000'}"
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
                expression { !params.USE_DOCKER && !params.BASE_URL?.trim() }
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
                    archiveArtifacts artifacts: 'api-test-report.html', allowEmptyArchive: true
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
