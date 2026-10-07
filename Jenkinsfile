pipeline {
    agent any
    tools {
        nodejs 'NodeJS'
    }

    parameters {
        choice(
            name: 'TEST_SUITE',
            choices: ['smoke', 'regression', 'all'],
            description: 'Test suite to run'
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
        PATH = "/opt/homebrew/bin:/usr/local/bin:${PATH}"

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
                expression { params.BROWSER != 'browserstack' && !params.USE_DOCKER }
            }
            steps {
                echo '🚀 Starting mock server on port 3000...'
                sh 'mkdir -p logs'
                sh 'nohup node mock-server.js > logs/mock-server.log 2>&1 &'
                sh 'sleep 3'
                sh 'curl -s http://localhost:3000 || curl -s http://localhost:3000/health || echo "Mock server started"'
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
                                npm run test:smoke -- --baseUrl https://browserstack.com
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
                                npm run test:regression -- --baseUrl https://browserstack.com
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
            archiveArtifacts artifacts: 'allure-results/**'
            
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
    sh 'mkdir -p logs && docker build -t agentic-qa-demo:${BUILD_NUMBER} .'
    sh "docker run --rm -v \"\${WORKSPACE}\":/app -v /app/node_modules agentic-qa-demo:\${BUILD_NUMBER} sh -c 'npm ci && (node mock-server.js > logs/mock-server.log 2>&1 &) && sleep 3 && ${testCommand}'"
}
